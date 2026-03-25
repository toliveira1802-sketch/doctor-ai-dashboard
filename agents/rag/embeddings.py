from openai import OpenAI

from config.settings import settings


class EmbeddingService:
    """Abstraction over embedding providers with OpenAI as primary."""

    def __init__(self):
        self._openai_client: OpenAI | None = None

    @property
    def openai_client(self) -> OpenAI:
        if self._openai_client is None:
            self._openai_client = OpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    def embed_text(self, text: str) -> list[float]:
        """Generate embedding for a single text."""
        response = self.openai_client.embeddings.create(
            model=settings.embedding_model,
            input=text,
            dimensions=settings.embedding_dimensions,
        )
        return response.data[0].embedding

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for a batch of texts."""
        if not texts:
            return []
        # OpenAI supports up to 2048 inputs per request
        all_embeddings = []
        batch_size = 512
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = self.openai_client.embeddings.create(
                model=settings.embedding_model,
                input=batch,
                dimensions=settings.embedding_dimensions,
            )
            all_embeddings.extend([d.embedding for d in response.data])
        return all_embeddings


# Singleton
embedding_service = EmbeddingService()
