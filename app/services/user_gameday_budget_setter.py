from sqlalchemy import func
from sqlalchemy.orm import Session
from app.config import settings


def get_gamday_data(db: Session):
    from app.models import Game

    """Getting the number of games played on each gameday and their stage."""
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
    gameday_data = []
    for row in results:
        # ✅ Get the first game of this gameday
        first_game = (
            db.query(Game.stage)
            .filter(
                func.date(Game.match_time) == row.gameday,  # ✅ Match the gameday
                Game.match_time
                == row.first_game_time,  # ✅ Get the first game of that day
            )
            .first()
        )
        gameday_data.append(
            {
                "gameday": row.gameday,
                "num_games": row.num_games,
                "stage": first_game.stage
                if first_game
                else "Unknown",  # ✅ Assign stage
            }
        )
    return gameday_data


def set_gameday_budget(db: Session):
    """Sets the betting budget at the start of each gameday."""
    gameday_data = get_gamday_data(db)
    gameday_budget_dict = {}
    for gameday in gameday_data:
        num_of_games = gameday["num_games"]
        stage = gameday["stage"]
        gameday_budget = (
            num_of_games * settings.STAGE_TO_GAMEDAY_BUDGET_KEY_MAPPING.get(stage, 0)
        )
        gameday_budget_dict[str(gameday["gameday"])] = gameday_budget
    return gameday_budget_dict
