from pydantic import BaseModel
import uuid
from datetime import datetime


class ConnectionCreate(BaseModel):
    to_user_id: uuid.UUID
    message: str


class Connection(ConnectionCreate):
    id: uuid.UUID
    from_user_id: uuid.UUID
    status: str = "sent"
    created_at: datetime


class MessageCreate(BaseModel):
    connection_id: uuid.UUID
    content: str


class Message(MessageCreate):
    id: uuid.UUID
    sender_id: uuid.UUID
    created_at: datetime
