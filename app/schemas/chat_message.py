from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Define the base schema for a chat message
class ChatMessage(BaseModel):
    id: Optional[int]
    user_id: int
    username: str
    content: str = Field(default=None, max_length=255)  # Validate max length of message content
    timestamp: datetime = Field(default_factory=datetime.utcnow)  # Timestamp default to current time

    class Config:
        # Allow the use of the alias (_id) for field
        allow_population_by_field_name = True

# Schema for creating a new chat message
class ChatMessageCreate(BaseModel):
    user_id: int
    username: str
    content: str = Field(default=None, max_length=255)  # Validate max length of message content
    timestamp: datetime = Field(default_factory=datetime.utcnow)  # Timestamp default to current time

    class Config:
        # Allow the use of alias for field names
        min_anystr_length = 1
        anystr_strip_whitespace = True

# Schema for updating a chat message
class ChatMessageUpdate(BaseModel):
    content: str = Field(..., max_length=255)

    class Config:
        # Validation for whitespace trimming and ensuring at least one character
        min_anystr_length = 1
        anystr_strip_whitespace = True

# Response schema to return a message when a new message is sent or updated
class ChatMessageResponse(ChatMessage):
    class Config:
        # This can be used to serialize responses with the message data
        orm_mode = True
