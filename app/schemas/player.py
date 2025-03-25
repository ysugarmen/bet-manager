from pydantic import BaseModel
from typing import Dict, Any


class PlayerBase(BaseModel):
    id: int
    name: str
    team_id: int
    stats: Dict[str, Any]

    class Config:
        orm_mode = True


class PlayerResponse(PlayerBase):
    pass
