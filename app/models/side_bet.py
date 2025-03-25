from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, JSON
from sqlalchemy.orm import Session
from app.models import Base
from app.models.game import Game
from app.schemas.bet import BetState
from app.config import Settings
from datetime import datetime


class SideBet(Base):
    __tablename__ = "side_bets"
    id = Column(Integer, primary_key=True, index=True)
    last_time_to_bet = Column(DateTime, nullable=True)
    time_to_check_answer = Column(DateTime, nullable=True)
    question = Column(String, nullable=False)
    options = Column(JSON, nullable=False)
    answer = Column(JSON, nullable=True)
    reward = Column(Integer, nullable=False)
    bet_state = Column(Enum(BetState), nullable=False, default=BetState.editable)

    def __repr__(self):
        return f"<SideBet(id={self.id}, question={self.question}, answer={self.answer}, reward={self.reward}, bet_state={self.bet_state})>"

    def update_bet_state(self):
        """
        Updates the bet state based on the user's bet choice and the side bet's answer.
        """
        current_time = datetime.utcnow()
        if current_time > self.last_time_to_bet:
            self.bet_state = BetState.locked


class UsersSideBet(Base):
    __tablename__ = "users_side_bets"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    side_bet_id = Column(Integer, nullable=False)
    bet_choice = Column(JSON, nullable=False)

    reward = Column(Integer, nullable=True)

    def __repr__(self):
        return f"<UsersSideBet(id={self.id}, user_id={self.user_id}, side_bet_id={self.side_bet_id}, bet_choice={self.bet_choice}, bet_state={self.bet_state}, reward={self.reward})>"

    @classmethod
    def calculate_reward(self, side_bet: SideBet):
        """
        Calculates the reward for the user's bet based on the side bet's reward and the user's bet choice.
        """
        if side_bet.answer == self.bet_choice:
            self.reward = side_bet.reward
        else:
            self.reward = 0
