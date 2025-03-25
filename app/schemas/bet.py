from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime
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
    reward: Optional[float] = None

    class Config:
        orm_mode = True
        from_attributes = True
        allow_population_by_field_name = True


class BetChoiceModel(BaseModel):
    bet_choice: Any  # Define as Dict to expect a JSON object


class SideBetResponse(BaseModel):
    id: int
    question: str
    options: Any  # JSON type, make sure to handle it accordingly in your application logic
    last_time_to_bet: Optional[datetime]
    time_to_check_answer: Optional[datetime]
    answer: Optional[Any]  # JSON type for the answer
    reward: int
    bet_state: BetState

    class Config:
        orm_mode = True


class UserSideBetResponse(BaseModel):
    id: int
    user_id: int
    side_bet_id: int
    bet_choice: Any  # JSON type, handling choices made by the user
    timestamp: datetime
    reward: Optional[int] = None  # Nullable if reward has not been decided yet

    class Config:
        orm_mode = True
