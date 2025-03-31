from sqlalchemy.orm import Session, relationship
from sqlalchemy import Column, Integer, String, DateTime, and_, Float, Enum
from app.config import settings
from app.models import Base
from app.schemas.game import GameState
from datetime import datetime, timedelta


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    team1 = Column(String, nullable=False)
    team2 = Column(String, nullable=False)
    match_time = Column(DateTime, nullable=False)
    stadium = Column(String, nullable=True)
    game_state = Column(Enum(GameState), nullable=False, default=GameState.upcoming)

    score_team1 = Column(Integer, nullable=True)  # Normal time score
    score_team2 = Column(Integer, nullable=True)  # Normal time score

    penalty_score_team1 = Column(Integer, nullable=True)  # Penalty shootout score
    penalty_score_team2 = Column(Integer, nullable=True)  # Penalty shootout score

    game_winner = Column(String, nullable=True)  # Null until the game is played

    team1_odds = Column(Float, nullable=True)
    team2_odds = Column(Float, nullable=True)
    draw_odds = Column(Float, nullable=True)

    def __repr__(self):
        return (
            f"<Game(id={self.id}, {self.team1} vs {self.team2} at {self.match_time})>"
        )

    def update_game_state(self):
        current_time = datetime.utcnow()
        game_starting_time = self.match_time
        if current_time < game_starting_time:
            self.game_state = GameState.upcoming
        elif (
            game_starting_time
            < current_time
            < (game_starting_time + timedelta(minutes=settings.GAME_STANDART_LENGTH))
        ):
            self.game_state = GameState.ongoing
        else:
            self.game_state = GameState.history
