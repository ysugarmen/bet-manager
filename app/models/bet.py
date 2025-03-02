from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship, Session
from app.models import Base
from app.models.game import Game
from app.schemas.bet import BetState
from app.config import Settings
from datetime import datetime, timedelta

class Bet(Base):
    __tablename__ = 'bets'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    game_id = Column(Integer, ForeignKey('games.id'), nullable=False)
    bet_choice = Column(String, nullable=False)
    bet_state = Column(Enum(BetState), nullable=False, default=BetState.editable)
    amount = Column(Integer, nullable=False)
    reward = Column(Integer, nullable=True)

    # Relationships
    #game = relationship('Game', back_populates='bets')
    #user = relationship('User', back_populates='bets')

    def __repr__(self):
        return f"<Bet(id={self.id}, user_id={self.user_id}, game_id={self.game_id}, bet_choice={self.bet_choice}, bet_amount={self.amount})>"
    
    @classmethod
    def calculate_reward(self, game: Game):
        """
        Calculates the reward for a given bet choice and game winner.
        """
        if game.game_winner == "1":
            odds = game.team1_odds
        elif game.game_winner == "2":
            odds = game.team2_odds
        elif game.game_winner == "X":
            odds = game.draw_odds
        if game.game_winner == self.bet_choice:
            self.reward = self.amount * odds
    
    def update_bet_state(self, db: Session):
        current_time = datetime.utcnow()
        game = Game.get_by_id(db, self.game_id)
        game_starting_time = game.match_time

        if game.game_state == "upcoming" and current_time < game_starting_time:
            self.bet_state = BetState.editable
        
        if game.game_state == "ongoing" or game.game_state == "history":
            self.bet_state = BetState.locked
