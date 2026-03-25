"""Blog content generator from Study RAG knowledge."""

from services.llm_router import llm_router
from rag.retriever import RAGRetriever


class BlogGenerator:
    """Generate blog posts from Study RAG content for Doctor Auto Prime."""

    BLOG_PROMPT = """Voce e um redator especialista em conteudo automotivo para o blog da Doctor Auto Prime.

Regras:
- Escreva em portugues brasileiro, tom profissional mas acessivel
- Titulo atraente com SEO (inclua palavras-chave relevantes)
- Estrutura: introducao, desenvolvimento com subtitulos (H2/H3), conclusao com CTA
- Entre 800 e 1500 palavras
- Inclua dicas praticas para o leitor
- Mencione a Doctor Auto Prime naturalmente como referencia
- Use dados e informacoes tecnicas do contexto fornecido
- Termine com um CTA para agendar servico ou avaliacao

Formato de saida:
TITULO: [titulo do post]
META_DESCRIPTION: [descricao para SEO, max 160 chars]
TAGS: [tag1, tag2, tag3]
---
[conteudo do post em markdown]"""

    async def generate_post(
        self,
        topic: str,
        retriever: RAGRetriever,
        style: str = "informativo",
    ) -> dict:
        """Generate a blog post based on Study RAG content."""

        # Search Study RAG for relevant content
        results = retriever.retrieve_from_study(topic, n_results=8)

        context = "\n\n".join(
            f"[Fonte: {r.collection}] {r.document}" for r in results
        )

        prompt = (
            f"Estilo: {style}\n"
            f"Tema: {topic}\n\n"
            f"Escreva um artigo completo para o blog da Doctor Auto Prime sobre este tema."
        )

        system = self.BLOG_PROMPT
        if context:
            system += f"\n\n## Informacoes do RAG de Estudo para embasar o artigo:\n{context}"

        response = await llm_router.chat(
            provider="openai",
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            system_prompt=system,
            temperature=0.7,
            max_tokens=3000,
        )

        # Parse response
        return self._parse_blog_response(response, topic, results)

    async def generate_from_news(self, retriever: RAGRetriever) -> dict:
        """Auto-generate a blog post from latest news in Study RAG."""
        results = retriever.retrieve(
            "noticias automotivas novidades recalls",
            ["study_industry_news"],
            n_results=5,
        )

        if not results:
            return {"error": "Sem noticias no RAG de Estudo para gerar post."}

        # Pick the most relevant topic
        top_result = results[0]
        topic = f"Novidades automotivas: {top_result.document[:100]}"

        return await self.generate_post(topic, retriever, style="noticioso")

    def _parse_blog_response(self, response: str, topic: str, sources: list) -> dict:
        """Parse the LLM response into structured blog post data."""
        title = topic
        meta_description = ""
        tags = []
        content = response

        lines = response.split("\n")
        content_start = 0

        for i, line in enumerate(lines):
            if line.startswith("TITULO:"):
                title = line.replace("TITULO:", "").strip()
            elif line.startswith("META_DESCRIPTION:"):
                meta_description = line.replace("META_DESCRIPTION:", "").strip()
            elif line.startswith("TAGS:"):
                tags_str = line.replace("TAGS:", "").strip()
                tags = [t.strip() for t in tags_str.split(",")]
            elif line.strip() == "---":
                content_start = i + 1
                break

        if content_start > 0:
            content = "\n".join(lines[content_start:]).strip()

        return {
            "title": title,
            "meta_description": meta_description,
            "tags": tags,
            "content": content,
            "word_count": len(content.split()),
            "sources_used": len(sources),
        }


blog_generator = BlogGenerator()
