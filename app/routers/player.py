from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, cast, Integer
from sqlalchemy.orm import Session
from typing import Optional
from typing import List
from app.utils.database import get_db
from app.models.player import Player
from app.models.team import Team
from app.schemas.player import PlayerResponse
from app.utils.logger import get_logger

router = APIRouter(prefix="/players")
logger = get_logger("router.player")


@router.get("/sorted/by-goals", response_model=List[PlayerResponse])
def get_players_sorted_by_goals(
    limit: Optional[int] = Query(10, description="Number of top players to return"),
    db: Session = Depends(get_db),
):
    """
    Fetches players sorted by goals scored, with an optional limit.
    """
    players = (
        db.query(Player)
        .filter(cast(Player.stats["goals"], Integer) > 0)  # Ensure valid integer values
        .order_by(
            desc(cast(Player.stats["goals"], Integer))
        )  # Sort by goals (descending)
        .limit(limit)
        .all()
    )

    return players
