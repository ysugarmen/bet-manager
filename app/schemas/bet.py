from pydantic import BaseModel, Field
from typing import Optional
import enum


class BetBase(BaseModel):
    user_id: int
    game_id: int
    bet_choice: str
    bet_amount: int = Field(..., alias="amount")

    class config:
        allow_population_by_field_name = True


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
    bet_state: BetState

    class Config:
        orm_mode = True
        from_attributes = True
        allow_population_by_field_name = True
