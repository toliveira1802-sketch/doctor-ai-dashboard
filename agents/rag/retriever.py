from dataclasses import dataclass

from rag.chroma_client import ChromaManager
from rag.embeddings import embedding_service


@dataclass
class RetrievalResult:
    document: str
    metadata: dict
    score: float
    collection: str


class RAGRetriever:
    """Unified retrieval interface across multiple collections."""

    def __init__(self, chroma: ChromaManager):
        self.chroma = chroma

    def retrieve(
        self,
        query: str,
        collections: list[str],
        n_results: int = 5,
        where: dict | None = None,
    ) -> list[RetrievalResult]:
        """Retrieve relevant documents from multiple collections."""
        query_embedding = embedding_service.embed_text(query)

        all_results: list[RetrievalResult] = []

        for collection_name in collections:
            try:
                result = self.chroma.query(
                    collection_name=collection_name,
                    query_embedding=query_embedding,
                    n_results=n_results,
                    where=where,
                )

                if result["documents"] and result["documents"][0]:
                    for doc, meta, dist in zip(
                        result["documents"][0],
                        result["metadatas"][0],
                        result["distances"][0],
                    ):
                        all_results.append(
                            RetrievalResult(
                                document=doc,
                                metadata=meta,
                                score=1 - dist,  # cosine distance to similarity
                                collection=collection_name,
                            )
                        )
            except Exception as e:
                print(f"Error querying {collection_name}: {e}")

        # Sort by score descending, return top n
        all_results.sort(key=lambda r: r.score, reverse=True)
        return all_results[:n_results]

    def retrieve_from_study(
        self, query: str, n_results: int = 5
    ) -> list[RetrievalResult]:
        """Retrieve from Study RAG collections."""
        from rag.chroma_client import STUDY_COLLECTIONS
        return self.retrieve(query, STUDY_COLLECTIONS, n_results)

    def retrieve_from_operational(
        self, query: str, n_results: int = 5
    ) -> list[RetrievalResult]:
        """Retrieve from Operational RAG collections."""
        from rag.chroma_client import OPERATIONAL_COLLECTIONS
        return self.retrieve(query, OPERATIONAL_COLLECTIONS, n_results)
