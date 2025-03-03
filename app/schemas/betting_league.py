from pydantic import BaseModel, Field
from typing import Optional


class BettingLeagueBase(BaseModel):
    name: str = Field(
        ..., min_length=3, max_length=50, description="The username of the user"
    )
    description: Optional[str] = Field(
        None, max_length=200, description="The description of the league"
    )
    manager_id: int = Field(..., description="The id of the manager of the league")
    public: bool = Field(True, description="Whether the league is public or not")
    group_picture: Optional[str] = Field(
        None, description="The group picture of the league"
    )


class BettingLeagueCreate(BettingLeagueBase):
    pass


class BettingLeagueResponse(BettingLeagueBase):
    id: int = Field(..., description="The id of the league")
    members: list = Field(..., description="The list of members in the league")
    num_members: Optional[int] = Field(
        None, description="The number of members in the league"
    )
    code: Optional[str] = Field(None, description="The code of the league")
