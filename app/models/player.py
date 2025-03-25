from sqlalchemy import Column, Integer, String, JSON, ForeignKey
from sqlalchemy.orm import Session
from app.models import Base


class Player(Base):
    __tablename__ = "players"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), index=True)
    stats = Column(JSON, default={})

    def __repr__(self):
        return f"<Player {self.name}>"
