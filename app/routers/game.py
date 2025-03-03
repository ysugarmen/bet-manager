from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import cast, Date, func
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.utils.database import get_db
from app.models.game import Game
from app.schemas.game import GameResponse
from app.utils.logger import get_logger
from app.utils.scraper import (
    fetch_games_from_web,
    update_scores_from_web,
)

router = APIRouter(prefix="/games")
logger = get_logger("router.game")


# 📌 **GET ALL GAMES**
@router.get("/", response_model=List[GameResponse])
def get_all_games(db: Session = Depends(get_db)):
    """Retrieve all stored games."""
    logger.info("📋 Fetching all games from DB")
    games = Game.get_all(db)
    if not games:
        raise HTTPException(status_code=404, detail="No games found")
    return games


# 📌 **GET UPCOMING GAMES**
@router.get("/upcoming/by-date/{date}", response_model=List[GameResponse])
def get_upcoming_games_by_date(date: str, db: Session = Depends(get_db)):
    """Retrieve only upcoming games for a specific date."""
    logger.info(f"🔍 Fetching upcoming games for {date}")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        logger.error(f"❌ Invalid date format: {date}")
        raise HTTPException(
            status_code=400, detail="Invalid date format. Expected YYYY-MM-DD."
        )

    games = (
        db.query(Game)
        .filter(
            cast(Game.match_time, Date) == target_date,  # Match the date
            Game.game_state == "upcoming",  # Only fetch upcoming games
        )
        .order_by(Game.match_time)
        .all()
    )

    if not games:
        logger.warning(f"⚠️ No upcoming games found for {date}")

    return games


# 📌 **DELETE GAME BY ID**
@router.delete("/{game_id}")
def delete_game(game_id: int, db: Session = Depends(get_db)):
    """Delete a game by ID."""
    logger.info(f"🗑️ Deleting game with ID: {game_id}")
    deleted = Game.delete_by_id(db, game_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Game not found")
    return {"message": f"Game with ID {game_id} deleted successfully"}


# 📌 **IMPORT ALL GAMES FROM WEB**
@router.post("/import")
def import_all_games(db: Session = Depends(get_db)):
    """Fetch and store all upcoming Champions League matches."""
    logger.info("🔍 Importing all upcoming games")
    games = fetch_games_from_web()
    added_games = 0

    for game in games:
        if not Game.get_by_team_names(db, game.team1, game.team2):
            db.add(game)
            added_games += 1

    db.commit()
    return {"message": f"{added_games} new games imported successfully"}


# 📌 **IMPORT GAMES FROM A GIVEN DATE**
@router.post("/import/{target_date}")
def import_games_by_date(target_date: str, db: Session = Depends(get_db)):
    """Fetch and store games for a specific date."""
    logger.info(f"📅 Importing games for {target_date}")
    games = fetch_games_from_web(target_date)
    added_games = 0

    for game in games:
        if not Game.get_by_team_names(db, game.team1, game.team2):
            db.add(game)
            added_games += 1

    db.commit()
    return {"message": f"{added_games} games imported for {target_date}"}


# 📌 **UPDATE SCORES FOR ALL GAMES**
@router.put("/update-scores")
def update_all_scores(db: Session = Depends(get_db)):
    """Update scores for all games."""
    logger.info("🔄 Updating scores for all games")
    update_scores_from_web(db)
    return {"message": "All game scores updated successfully"}


# 📌 **UPDATE SCORES FOR A GIVEN DATE**
@router.put("/update-scores/{target_date}")
def update_scores_by_date(target_date: str, db: Session = Depends(get_db)):
    """Update scores for games on a specific date."""
    logger.info(f"🔄 Updating scores for {target_date}")
    update_scores_from_web(db, target_date)
    return {"message": f"Scores updated for {target_date}"}


@router.get("/by-date/{date}", response_model=List[GameResponse])
def get_games_by_date(date: str, db: Session = Depends(get_db)):
    """Retrieve all games for a specific date."""
    logger.info(f"🔍 Fetching games for {date}")
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        logger.error(f"❌ Invalid date format: {date}")
        raise HTTPException(
            status_code=400, detail="Invalid date format. Expected YYYY-MM-DD."
        )

    games = (
        db.query(Game)
        .filter(
            cast(Game.match_time, Date) == target_date
        )  # Correct way to filter by date
        .order_by(Game.match_time)
        .all()
    )

    if not games:
        logger.warning(f"⚠️ No games found for {date}")

    return games


@router.get("/dates", response_model=List[str])
def get_game_dates(db: Session = Depends(get_db)):
    """Retrieve all unique game dates from the database."""
    logger.info("📅 Fetching all unique game dates")
    dates = db.query(Game.match_time).distinct().order_by(Game.match_time).all()
    unique_dates = sorted({game.match_time.strftime("%Y-%m-%d") for game in dates})

    if not unique_dates:
        logger.info("⚠️ No upcoming games found")
        return []

    logger.info(f"✅ Found {len(unique_dates)} upcoming game dates")
    return unique_dates


@router.get("/upcoming/dates", response_model=List[str])
def get_upcoming_game_dates(db: Session = Depends(get_db)):
    """Retrieve only dates that have upcoming games."""
    logger.info("🔍 Fetching dates with upcoming games")

    dates = (
        db.query(func.date(Game.match_time))
        .filter(Game.game_state == "upcoming")  # ✅ Only fetch dates with upcoming games
        .distinct()
        .order_by(func.date(Game.match_time))
        .all()
    )

    date_list = [str(date[0]) for date in dates]  # Convert to list of strings

    if not date_list:
        logger.warning("⚠️ No upcoming game dates found.")

    return date_list
