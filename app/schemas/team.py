from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any


class TeamBase(BaseModel):
    id: int
    name: str
    webpage_url: str
    logo_url: str
    points: int
    players: list = Field(..., description="The list of players in the team")
    stats: Dict[str, Any]

    class Config:
        orm_mode = True


class TeamResponse(TeamBase):
    pass
