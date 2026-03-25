from config.settings import settings


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """Split text into overlapping chunks by character count.

    Will be enhanced in Phase 3 with semantic chunking.
    """
    size = chunk_size or settings.chunk_size
    overlap = chunk_overlap or settings.chunk_overlap

    if len(text) <= size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunk = text[start:end]

        # Try to break at sentence boundary
        if end < len(text):
            last_period = chunk.rfind(".")
            last_newline = chunk.rfind("\n")
            break_point = max(last_period, last_newline)
            if break_point > size * 0.5:
                chunk = text[start : start + break_point + 1]
                end = start + break_point + 1

        chunks.append(chunk.strip())
        start = end - overlap

    return [c for c in chunks if c]
