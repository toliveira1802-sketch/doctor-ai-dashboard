from datetime import datetime
from pydantic import BaseModel, Field


class DocumentChunk(BaseModel):
    id: str
    content: str
    metadata: dict = Field(default_factory=dict)
    collection: str
    embedding: list[float] | None = None


class IngestRequest(BaseModel):
    title: str
    source_type: str  # 'pdf', 'web', 'manual', 'crm', 'notebook'
    source_url: str | None = None
    target_rag: str = "study"  # 'study' or 'operational'
    target_collection: str
    metadata: dict = Field(default_factory=dict)


class IngestResponse(BaseModel):
    document_id: str
    title: str
    chunk_count: int
    collection: str
    status: str


class DocumentInfo(BaseModel):
    id: str
    title: str
    source_type: str
    source_rag: str
    collection_name: str
    chunk_count: int
    status: str
    ingested_at: datetime | None = None
