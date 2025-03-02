from pydantic import BaseModel, Field
from typing import Optional
import enum

class BetBase(BaseModel):
    user_id: int
    game_id: int
    bet_choice: str
    bet_amount: int

class BetCreate(BetBase):
    pass

class BetState(str, enum.Enum):
    editable = "editable"
    locked = "locked"


class BetResponse(BaseModel):
    id: int
    user_id: int
    game_id: int
    bet_choice: str
    bet_amount: float = Field(..., alias="amount")
    class Config:
        orm_mode = True
        populate_by_name = True

