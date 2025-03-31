from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect
from sqlalchemy.orm import Session, registry
from app.routers import user, game, bet, betting_league, team, side_bet
from app.models import Base
from app.models.user import User
from app.models.game import Game
from app.models.bet import Bet
from app.models.side_bet import SideBet
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
    fetch_teams_from_web,
    fetch_players_from_web,
)
from app.services.side_bet_creation import create_side_bets
from app.services.side_bets_helper import (
    update_side_bets_answers,
    update_users_side_bets_rewards,
)
from app.utils.api_helper import fecth_and_process_games_data
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
    allow_origins=["https://bet-manager-frontend.vercel.app", "http://localhost:3000"],
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
app.include_router(team.router, tags=["teams"])
app.include_router(side_bet.router, tags=["side_bets"])


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
        "teams",
        "side-bets",
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
                Game.team1 == game.team1,
                Game.team2 == game.team2,
                Game.match_time == game.match_time,
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


def scheduled_games_and_bets_updates(db: Session):
    while True:
        logger.info("🔄 Running scheduled updates")

        try:
            fecth_and_process_games_data(db)
            update_game_states(db)  # ✅ Ensure all games have correct state
            update_bets_and_calculate_rewards(db)  # ✅ Update bet states & rewards
            update_user_points(db)  # ✅ Update user points
            update_side_bets_states(db)  # ✅ Update side bets states
            update_side_bets_answers(db)  # ✅ Update side bets answers
            update_users_side_bets_rewards(db)  # ✅ Update users side bets rewards

            db.commit()
        except Exception as e:
            logger.error(f"❌ Error in scheduled updates: {e}")

        finally:
            db.close()
            db = next(get_db())  # ✅ Refresh DB session

        logger.info("✅ Scheduled updates completed")
        time.sleep(6 * 60 * 60)  # ⏳ Run every 6 hours


def init_db():
    Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def startup_tasks():
    logger.info("🚀 Running startup tasks")
    init_db()
    db = next(get_db())

    fecth_and_process_games_data(db)
    update_game_states(db)  # ✅ Ensure all games have correct state
    fetch_teams_from_web(db)  # ✅ Fetch teams from FBRef
    fetch_players_from_web(db)  # ✅ Fetch players from FBRef
    create_side_bets(db)  # ✅ Create side bets
    update_bets_and_calculate_rewards(db)  # ✅ Update bet states & rewards
    update_user_points(db)  # ✅ Update user points
    update_side_bets_states(db)  # ✅ Update side bets states
    update_side_bets_answers(db)  # ✅ Update side bets answers
    update_users_side_bets_rewards(db)  # ✅ Update users side bets rewards

    logger.info("✅ Startup tasks completed")
    db.commit()
    db.close()

    # ✅ Start the scheduled updates in a separate thread
    logger.info("⏳ Starting background updates")
    thread = threading.Thread(
        target=scheduled_games_and_bets_updates, args=(next(get_db()),), daemon=True
    )
    thread.start()


def update_game_states(db: Session):
    logger.info("🔄 Updating game states")

    all_games = db.query(Game).all()
    for game in all_games:
        game.update_game_state()
    db.commit()
    logger.info("✅ Game states updated")


def update_bets_and_calculate_rewards(db: Session):
    logger.info("🔄 Updating bets and calculating rewards")

    relevant_bets = db.query(Bet).filter(Bet.bet_state != BetState.locked).all()
    for bet in relevant_bets:
        game = db.query(Game).filter(Game.id == bet.game_id).first()
        if game:
            bet.update_bet_state(db)  # ✅ Updates bet state
            if game.game_state == GameState.history and bet.reward is None:
                bet.calculate_reward(game)  # ✅ Calculate reward if missing

    db.commit()
    logger.info("✅ Bets updated and rewards calculated")


def update_user_points(db: Session):
    logger.info("🔄 Updating user points")

    users = db.query(User).all()
    for user in users:
        user.update_points(db)

    db.commit()
    logger.info("✅ User points updated")


def update_side_bets_states(db: Session):
    logger.info("🔄 Updating game states")

    all_side_bets = db.query(SideBet).all()
    for side_bet in all_side_bets:
        side_bet.update_bet_state()

    db.commit()
    logger.info("✅ Side bet states updated")


logger.info("✅ Bet Manager is ready to go!")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
