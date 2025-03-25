from sqlalchemy import Column, Integer, String, JSON
from sqlalchemy.orm import Session
from app.models import Base


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    webpage_url = Column(String)
    logo_url = Column(String)
    points = Column(Integer, default=0)
    players = Column(JSON, default=[])
    stats = Column(JSON, default={})

    def __repr__(self):
        return f"<Team(name='{self.name}', nationality='{self.nationality}', logo_url='{self.logo_url}', points='{self.points}')>"
