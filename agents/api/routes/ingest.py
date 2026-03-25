import json
import uuid

from fastapi import APIRouter, Request, UploadFile, File, Form
from pydantic import BaseModel
from models.document import IngestResponse
from rag.embeddings import embedding_service
from ingestion.chunker import chunk_text
from ingestion.pipeline import IngestionPipeline
from services.supabase_client import save_document_registry

router = APIRouter()


# --- URL and Perplexity ingestion models ---

class IngestURLRequest(BaseModel):
    url: str
    title: str | None = None
    target_collection: str = "study_industry_news"


class IngestPerplexityRequest(BaseModel):
    query: str
    target_collection: str = "study_industry_news"
    model: str = "sonar-pro"
    search_recency: str | None = None


# --- URL ingestion endpoint ---

@router.post("/ingest-url")
async def ingest_from_url(request: Request, body: IngestURLRequest):
    """Scrape a URL and ingest into Study RAG."""
    chroma = request.app.state.chroma
    pipeline = IngestionPipeline(chroma)
    result = await pipeline.ingest_from_url(
        url=body.url,
        title=body.title,
        target_collection=body.target_collection,
    )
    return result


# --- Perplexity research endpoint ---

@router.post("/ingest-perplexity")
async def ingest_from_perplexity(request: Request, body: IngestPerplexityRequest):
    """Research via Perplexity and ingest into Study RAG."""
    chroma = request.app.state.chroma
    pipeline = IngestionPipeline(chroma)
    result = await pipeline.ingest_from_perplexity(
        query=body.query,
        target_collection=body.target_collection,
        model=body.model,
        search_recency=body.search_recency,
    )
    return result

# Multimodal format mapping
AUDIO_FORMATS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg", ".flac"}
IMAGE_FORMATS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"}
VIDEO_FORMATS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}


def _detect_source_type(filename: str, declared_type: str) -> str:
    """Auto-detect source type from file extension."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in AUDIO_FORMATS:
        return "audio"
    if ext in IMAGE_FORMATS:
        return "image"
    if ext in VIDEO_FORMATS:
        return "video"
    if ext == ".pdf":
        return "pdf"
    return declared_type


async def _extract_text(content: bytes, filename: str, source_type: str, language: str = "pt") -> str:
    """Extract text from any supported file type."""

    if source_type == "audio":
        from ingestion.audio_loader import audio_loader
        result = audio_loader.transcribe_bytes(content, filename, language)
        return result["text"]

    elif source_type == "image":
        from ingestion.image_loader import image_loader
        result = image_loader.analyze_bytes(content, filename)
        return result["description"]

    elif source_type == "video":
        from ingestion.video_loader import video_loader
        result = video_loader.analyze_bytes(content, filename)
        return result["combined_text"]

    elif source_type == "pdf":
        try:
            import pdfplumber
            import tempfile
            from pathlib import Path

            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            text_parts = []
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            Path(tmp_path).unlink(missing_ok=True)
            return "\n\n".join(text_parts)
        except Exception:
            return ""

    else:
        # Plain text fallback
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return ""


@router.post("/ingest", response_model=IngestResponse)
async def ingest_document(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    source_type: str = Form("auto"),
    target_rag: str = Form("study"),
    target_collection: str = Form("study_car_manuals"),
    metadata: str = Form("{}"),
    language: str = Form("pt"),
):
    """Ingest any document type into a RAG collection.

    Supports: PDF, plain text, audio (mp3/wav/etc), image (png/jpg/etc), video (mp4/avi/etc).
    Audio is transcribed via Whisper, images analyzed via GPT-4o Vision,
    video combines both audio transcription + frame analysis.
    """
    chroma = request.app.state.chroma
    doc_id = str(uuid.uuid4())
    filename = file.filename or "unknown"

    # Auto-detect source type
    detected_type = _detect_source_type(filename, source_type)

    # Read file
    content = await file.read()

    # Extract text from any format
    text = await _extract_text(content, filename, detected_type, language)

    if not text or not text.strip():
        return IngestResponse(
            document_id=doc_id,
            title=title,
            chunk_count=0,
            collection=target_collection,
            status="empty_no_text_extracted",
        )

    # Chunk the text
    chunks = chunk_text(text)

    # Generate embeddings
    embeddings = embedding_service.embed_batch(chunks)

    # Store in ChromaDB
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    meta = json.loads(metadata) if isinstance(metadata, str) else metadata
    metadatas = [
        {
            **meta,
            "doc_id": doc_id,
            "chunk_index": i,
            "title": title,
            "source_type": detected_type,
            "original_filename": filename,
        }
        for i in range(len(chunks))
    ]

    chroma.add_documents(
        collection_name=target_collection,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=ids,
    )

    # Register in Supabase
    await save_document_registry({
        "id": doc_id,
        "title": title,
        "source_type": detected_type,
        "source_rag": target_rag,
        "collection_name": target_collection,
        "chunk_count": len(chunks),
        "status": "completed",
        "metadata": {**meta, "original_filename": filename, "language": language},
    })

    return IngestResponse(
        document_id=doc_id,
        title=title,
        chunk_count=len(chunks),
        collection=target_collection,
        status="completed",
    )
