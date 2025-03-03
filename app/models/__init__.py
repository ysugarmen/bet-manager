from sqlalchemy.orm import declarative_base

Base = declarative_base()

# ✅ Import models explicitly to ensure registration
from app.models.user import User
from app.models.game import Game
from app.models.bet import Bet
from app.models.betting_league import BettingLeague

# ✅ Ensure metadata is created
from app.utils.database import engine

Base.metadata.create_all(bind=engine)

__all__ = ["Base", "User", "Game", "Bet", "BettingLeague"]
