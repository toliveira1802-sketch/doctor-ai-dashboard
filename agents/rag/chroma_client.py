import chromadb
from chromadb.config import Settings as ChromaSettings

from config.settings import settings

# All collections in the system
STUDY_COLLECTIONS = [
    "study_car_manuals",
    "study_industry_news",
    "study_diagnostic_kb",
    "study_business_insights",
]

OPERATIONAL_COLLECTIONS = [
    "ops_client_support",
    "ops_service_procedures",
    "ops_pricing_guidelines",
]

ALL_COLLECTIONS = STUDY_COLLECTIONS + OPERATIONAL_COLLECTIONS


class ChromaManager:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=settings.chroma_host,
            port=settings.chroma_port,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collections: dict[str, chromadb.Collection] = {}

    def initialize_collections(self):
        """Create all collections if they don't exist."""
        for name in ALL_COLLECTIONS:
            collection = self.client.get_or_create_collection(
                name=name,
                metadata={
                    "hnsw:space": "cosine",
                    "source_rag": "study" if name.startswith("study_") else "operational",
                },
            )
            self._collections[name] = collection
            print(f"  Collection ready: {name} ({collection.count()} docs)")

    def get_collection(self, name: str) -> chromadb.Collection:
        """Get a collection by name."""
        if name not in self._collections:
            self._collections[name] = self.client.get_or_create_collection(name=name)
        return self._collections[name]

    def add_documents(
        self,
        collection_name: str,
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
        ids: list[str],
    ):
        """Add documents with pre-computed embeddings to a collection."""
        collection = self.get_collection(collection_name)
        collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids,
        )

    def query(
        self,
        collection_name: str,
        query_embedding: list[float],
        n_results: int = 5,
        where: dict | None = None,
    ) -> dict:
        """Query a collection with an embedding vector."""
        collection = self.get_collection(collection_name)
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where
        return collection.query(**kwargs)

    def list_collections_info(self) -> list[dict]:
        """Return info about all collections."""
        result = []
        for name in ALL_COLLECTIONS:
            col = self.get_collection(name)
            result.append({
                "name": name,
                "count": col.count(),
                "rag": "study" if name.startswith("study_") else "operational",
            })
        return result
