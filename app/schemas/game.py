from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import enum

class GameBase(BaseModel):
    team1: str
    team2: str
    match_time: datetime

class GameCreate(GameBase):
    pass  # Same as GameBase, but used for creating new games

class GameResponse(GameBase):
    id: int
    score_team1: Optional[int] = None
    score_team2: Optional[int] = None
    team1_logo: Optional[str] = None
    team2_logo: Optional[str] = None
    # ✅ Add betting odds
    team1_odds: Optional[float] = None
    team2_odds: Optional[float] = None
    draw_odds: Optional[float] = None

    class Config:
        orm_mode = True  # Enables SQLAlchemy ORM compatibility

class GameState(str, enum.Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    history = "history"
