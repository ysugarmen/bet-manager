from sqlalchemy import Column, Integer, String, DateTime, func, CheckConstraint, JSON
from sqlalchemy.orm import relationship, Session
from sqlalchemy.orm.attributes import flag_modified
from app.models import Base
from app.models.bet import Bet
from app.models.betting_league import BettingLeague
from app.utils.database import get_db
from app.config import settings
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    points = Column(Integer, default=0)
    gameday_budget = Column(JSON, nullable=False, default={})
    betting_leagues = Column(JSON, default=[])

    # Relationships
    #bets = relationship("Bet", back_populates="user", cascade="all, delete-orphan")
    #leagues = relationship("BettingLeague", secondary="betting_league", back_populates="users")

    __table_args__ = (
        CheckConstraint("username <> ''", name="username_not_empty"),
        CheckConstraint("LENGTH(username) >= 3", name="username_min_length"),
        CheckConstraint("email <> ''", name="email_not_empty"),
    )

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})"

    
    def update_gameday_budget(self, gameday: str, bet_amount: int, db: Session):
        current_gameday_budget = self.gameday_budget[gameday]
        if not bet_amount or not current_gameday_budget or (current_gameday_budget - bet_amount < 0):
            return False
        self.gameday_budget[gameday] -= bet_amount
        flag_modified(self, "gameday_budget")
        db.commit()  # ✅ Now commits correctly
        return True
    
    def join_league(self, betting_league: BettingLeague, db: Session):
        if betting_league.id not in self.betting_leagues:
            self.betting_leagues.append(betting_league.id)  # Append league ID
            flag_modified(self, "betting_leagues")  # Notify SQLAlchemy of the change
            db.add(self)  # Ensure SQLAlchemy tracks the update


    def leave_league(self, league_id: int, db: Session):
        if league_id in self.betting_leagues:
            self.betting_leagues.remove(league_id)  # Remove by value
            flag_modified(self, "betting_leagues")
            db.add(self)
