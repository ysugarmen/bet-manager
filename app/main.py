from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect
from sqlalchemy.orm import Session, registry
from app.routers import user, game, bet, betting_league
from app.models import Base
from app.models.user import User
from app.models.game import Game
from app.models.bet import Bet
from app.models.betting_league import BettingLeague
from app.config import settings
from app.schemas.game import GameState
from app.schemas.bet import BetState
from app.utils.logger import get_logger
from app.utils.database import get_db, engine
from app.utils.scraper import (
    fetch_games_from_web,
    update_scores_from_web,
    fetch_betting_odds,
)
from pathlib import Path
import time
import threading, os


logger = get_logger("app_main")

app = FastAPI(
    title="Bet Manager",
    description="A simple betting management system",
    version="1.0.0",
    contact={
        "name": "Yonatan Sugarmen",
        "email": "sugaryoni3@gmail.com",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
)

logger.info("🚀 Bet Manager is starting up...")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error("🔥 Exception in request: {}", exc, extra={"url": request.url.path})
        raise exc  # Re-raise to keep standard FastAPI error handling

    process_time = time.time() - start_time

    try:
        logger.info(
            "📡 {method} {url} - {status} - {time:.2f}s",
            method=request.method,
            url=request.url.path,
            status=response.status_code,
            time=process_time,
        )
    except KeyError as log_error:
        logger.warning(f"⚠️ Logging error: {log_error}")

    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"🔥 Exception: {str(exc)}", extra={"url": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


# Importing routes
app.include_router(user.router, tags=["users"])
app.include_router(game.router, tags=["games"])
app.include_router(bet.router, tags=["bets"])
app.include_router(betting_league.router, tags=["betting_leagues"])


# Serve React App
frontend_build_dir = Path(__file__).parent.parent / "frontend" / "build"
if frontend_build_dir.exists():
    app.mount(
        "/static", StaticFiles(directory=frontend_build_dir / "static"), name="static"
    )

logos_dir = os.path.abspath("static/team_logos")

if not os.path.exists(logos_dir):
    print(f"❌ Directory does not exist: {logos_dir}")

app.mount("/static", StaticFiles(directory="static"), name="static")

index_html = frontend_build_dir / "index.html"


@app.get("/{full_path:path}", response_class=FileResponse)
async def serve_react(full_path: str):
    """
    Serves React's `index.html` for frontend routes, but NOT for API paths.
    """
    api_prefixes = [
        "users",
        "betting-leagues",
        "games",
        "bets",
    ]  # ✅ Add all API prefixes
    if any(full_path.startswith(prefix) for prefix in api_prefixes):
        logger.warning(f"🚨 API path detected in React serve_react: {full_path}")
        return JSONResponse(status_code=404, content={"error": "API route not found"})

    if index_html.exists():
        return FileResponse(index_html)

    logger.warning("⚠️ React build not found. Run `npm run build` in `frontend/`")
    return JSONResponse(
        status_code=404,
        content={"error": "React build not found. Run `npm run build` in `frontend/`"},
    )


def fetch_and_store_games(db: Session, target_date: str = None):
    logger.info(
        f"🔄 Fetching {'all games' if not target_date else f'games for {target_date}'} from web"
    )

    games = fetch_games_from_web(db, target_date)
    if not games:
        logger.info("⚠️ No new games found")
        return

    added_games = 0
    for game in games:
        db_game = (
            db.query(Game)
            .filter(
                (Game.team1 == game.team1)
                & (Game.team2 == game.team2)
                & (Game.match_time == game.match_time)
            )
            .first()
        )
        if not db_game:
            db.add(game)
            added_games += 1

    db.commit()
    logger.info(f"✅ {added_games} new games added to the database")

    # Update betting odds
    fetch_betting_odds(db)


def scheduled_game_updates(db: Session):
    while True:
        logger.info("🔄 Running scheduled game update")

        try:
            # Fetch and store new games
            fetch_and_store_games(db)

            # Update all scores
            update_scores_from_web(db)

            # Update game states
            relevant_games = (
                db.query(Game).filter(Game.game_state != GameState.history).all()
            )
            for game in relevant_games:
                game.update_game_state()

            db.commit()

        except Exception as e:
            logger.error(f"❌ Error in scheduled updates: {e}")

        finally:
            db.close()
            db = next(get_db())  # ✅ Refresh the DB session

        logger.info("✅ Scheduled game update completed")
        time.sleep(6 * 60 * 60)  # ⏳ Wait 6 hours


def init_db():
    Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def startup_tasks():
    """
    Run tasks when the app starts:
    - Fetch new games
    - Update game states
    - Start background task for scheduled updates
    """
    logger.info("🚀 Fetching initial games on startup")
    init_db()
    db = next(get_db())

    # ✅ Fetch & store new games
    fetch_and_store_games(db)
    if not settings.DEBUG_MODE:
        # ✅ Update all game states
        relevant_games = (
            db.query(Game).filter(Game.game_state != GameState.history).all()
        )
        for game in relevant_games:
            game.update_game_state()

        relevant_bets = db.query(Bet).filter(Bet.bet_state != BetState.locked).all()
        for bet in relevant_bets:
            bet.update_bet_state(db)
        logger.info("✅ Startup tasks completed: Games fetched & states updated")
    db.commit()
    db.close()

    # ✅ Start the scheduled updates in a separate thread
    logger.info("⏳ Starting background task for scheduled updates")
    thread = threading.Thread(
        target=scheduled_game_updates, args=(next(get_db()),), daemon=True
    )
    thread.start()


logger.info("✅ Bet Manager is ready to go!")
