from sqlalchemy.orm import Session, relationship
from sqlalchemy import Column, Integer, String, DateTime, and_, Float, Enum
from app.config import settings
from app.models import Base
from app.schemas.game import GameState
from datetime import datetime, timedelta


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    stage = Column(String, nullable=True)
    gameday = Column(Integer, nullable=True)
    team1 = Column(String, nullable=False)
    team2 = Column(String, nullable=False)
    match_time = Column(DateTime, nullable=False)
    game_state = Column(Enum(GameState), nullable=False, default=GameState.upcoming)
    score_team1 = Column(Integer, nullable=True)  # Null until the game is played
    score_team2 = Column(Integer, nullable=True)  # Null until the game is played
    game_winner = Column(String, nullable=True)  # Null until the game is played

    team1_odds = Column(Float, nullable=True)
    team2_odds = Column(Float, nullable=True)
    draw_odds = Column(Float, nullable=True)

    # Relationships
    # bets = relationship("Bet", back_populates="game")

    def __repr__(self):
        return (
            f"<Game(id={self.id}, {self.team1} vs {self.team2} at {self.match_time})>"
        )

    @classmethod
    def get_by_team_names(cls, db: Session, team1: str, team2: str):
        """
        Retrieve a game by team names (regardless of order).
        """
        return (
            db.query(cls)
            .filter(
                and_(
                    (cls.team1 == team1) & (cls.team2 == team2)
                    | (cls.team1 == team2) & (cls.team2 == team1)
                )
            )
            .first()
        )

    @classmethod
    def get_all(cls, db: Session):
        """
        Retrieve all games.
        """
        return db.query(Game).order_by(Game.match_time).all()

    @classmethod
    def get_by_id(cls, db: Session, game_id: int):
        """
        Retrieve a game by id.
        """
        return db.query(cls).filter(cls.id == game_id).first()

    @classmethod
    def get_by_date(cls, db: Session, target_date: str):
        """Retrieve all games for a given date."""
        return db.query(cls).filter(cls.match_time.startswith(target_date)).all()

    @classmethod
    def delete_by_id(cls, db: Session, game_id: int):
        """Delete a game by ID."""
        game = db.query(cls).filter(cls.id == game_id).first()
        if game:
            db.delete(game)
            db.commit()
            return True
        return False

    @classmethod
    def detirmine_game_winner(cls, score_team1: int, score_team2: int):
        """Determine the game result based on the scores."""
        if not score_team1 or not score_team2:
            return None
        if score_team1 > score_team2:
            return "1"
        elif score_team2 > score_team1:
            return "2"
        elif score_team1 == score_team2:
            return "X"
        else:
            return None

    def update_game_state(self):
        current_time = datetime.now()
        game_starting_time = self.match_time
        if current_time < game_starting_time:
            self.game_state = GameState.upcoming
        elif (
            game_starting_time
            < current_time
            < (game_starting_time + timedelta(minutes=settings.GAME_STANSDART_LENGTH))
        ):
            self.game_state = GameState.ongoing
        else:
            self.game_state = GameState.history
