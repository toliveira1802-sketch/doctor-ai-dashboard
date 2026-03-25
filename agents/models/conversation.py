from datetime import datetime
from pydantic import BaseModel, Field


class Message(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    agent: str | None = None
    rag_sources: list[dict] = Field(default_factory=list)


class Conversation(BaseModel):
    id: str | None = None
    client_id: str | None = None
    external_client_id: str | None = None
    channel: str = "come_app"
    status: str = "active"
    classification: str | None = None  # 'hot', 'warm', 'cold'
    messages: list[Message] = Field(default_factory=list)
    metadata: dict = Field(default_factory=dict)
    started_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    message: str
    external_client_id: str | None = None
    channel: str = "come_app"
    metadata: dict = Field(default_factory=dict)


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    classification: str | None = None
    rag_sources: list[dict] = Field(default_factory=list)
    agent: str = "ana"
