from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings


def get_gamday_data(db: Session):
    from app.models import Game

    """Getting the number of games played on each gameday."""
    results = (
        db.query(
            func.date(Game.match_time).label("gameday"),
            func.count().label("num_games"),
            func.min(Game.match_time).label("first_game_time"),
        )
        .group_by(func.date(Game.match_time))
        .order_by(func.date(Game.match_time))
        .all()
    )
    gameday_data = [
        {
            "gameday": row.gameday,
            "num_games": row.num_games,
        }
        for row in results
    ]
    return gameday_data


def set_gameday_budget(db: Session):
    """Sets the betting budget at the start of each gameday."""
    gameday_data = get_gamday_data(db)
    gameday_budget_dict = {
        str(gameday["gameday"]): gameday["num_games"] * 2  # 2 coins per game
        for gameday in gameday_data
    }
    return gameday_budget_dict
