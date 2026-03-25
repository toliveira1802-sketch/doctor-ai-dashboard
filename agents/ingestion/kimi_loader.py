import base64
import tempfile
from pathlib import Path

import httpx

from config.settings import settings


class KimiLoader:
    """Use Kimi (Moonshot AI) for processing long documents.

    Kimi has a 2M token context window, ideal for breaking down
    large technical manuals, contracts, and documentation into
    structured chunks for RAG ingestion.
    """

    BASE_URL = "https://api.moonshot.cn/v1"

    def __init__(self):
        self._api_key: str | None = None

    @property
    def api_key(self) -> str:
        if self._api_key is None:
            self._api_key = settings.kimi_api_key
        return self._api_key

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def upload_file(self, file_path: str) -> str:
        """Upload a file to Kimi for processing. Returns file_id."""
        path = Path(file_path)
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.BASE_URL}/files",
                headers={"Authorization": f"Bearer {self.api_key}"},
                files={"file": (path.name, open(file_path, "rb"), "application/octet-stream")},
                data={"purpose": "file-extract"},
            )
            response.raise_for_status()
            return response.json()["id"]

    async def get_file_content(self, file_id: str) -> str:
        """Get the extracted text content from an uploaded file."""
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.get(
                f"{self.BASE_URL}/files/{file_id}/content",
                headers=self._headers(),
            )
            response.raise_for_status()
            return response.json().get("content", "")

    async def process_document(
        self,
        file_path: str,
        task: str = "extract_and_structure",
        custom_prompt: str | None = None,
    ) -> dict:
        """Process a long document with Kimi.

        Args:
            file_path: Path to the document (PDF, DOCX, TXT, etc).
            task: Processing task type.
            custom_prompt: Optional custom instructions.

        Returns dict with 'sections', 'summary', and 'raw_content'.
        """
        # Upload file to Kimi
        file_id = await self.upload_file(file_path)
        file_content = await self.get_file_content(file_id)

        # Build prompt based on task
        prompts = {
            "extract_and_structure": (
                "Analise este documento tecnico e:\n"
                "1. Identifique todas as secoes e subsecoes\n"
                "2. Para cada secao, extraia o conteudo principal\n"
                "3. Identifique tabelas, especificacoes tecnicas e valores numericos\n"
                "4. Gere um resumo executivo do documento\n\n"
                "Retorne em formato estruturado com:\n"
                "- RESUMO: resumo geral\n"
                "- SECOES: lista de secoes com titulo e conteudo\n"
                "- DADOS_TECNICOS: especificacoes, tabelas e valores extraidos\n\n"
                "Responda em portugues brasileiro."
            ),
            "break_into_chunks": (
                "Quebre este documento em secoes tematicas independentes. "
                "Cada secao deve ser autocontida e fazer sentido sozinha. "
                "Mantenha contexto tecnico e referencias cruzadas. "
                "Separe cada secao com '---CHUNK---'. "
                "Responda em portugues brasileiro."
            ),
            "extract_technical": (
                "Extraia TODAS as informacoes tecnicas deste documento:\n"
                "- Especificacoes (torques, pressoes, medidas, fluidos)\n"
                "- Intervalos de manutencao\n"
                "- Procedimentos passo-a-passo\n"
                "- Codigos de erro e diagnostico\n"
                "- Pecas e numeros de referencia\n\n"
                "Organize por categoria. Responda em portugues brasileiro."
            ),
            "summarize": (
                "Faca um resumo detalhado deste documento, cobrindo todos os "
                "pontos principais. O resumo deve ter entre 1000 e 3000 palavras. "
                "Responda em portugues brasileiro."
            ),
        }

        system_prompt = custom_prompt or prompts.get(task, prompts["extract_and_structure"])

        # Call Kimi with the file content
        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers=self._headers(),
                json={
                    "model": "moonshot-v1-128k",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "system",
                            "content": f"Conteudo do documento:\n\n{file_content}",
                        },
                        {
                            "role": "user",
                            "content": "Processe o documento conforme as instrucoes.",
                        },
                    ],
                    "temperature": 0.1,
                    "max_tokens": 16384,
                },
            )
            response.raise_for_status()
            data = response.json()

        result_text = data["choices"][0]["message"]["content"]

        # Parse sections if task was break_into_chunks
        sections = []
        if task == "break_into_chunks" and "---CHUNK---" in result_text:
            sections = [s.strip() for s in result_text.split("---CHUNK---") if s.strip()]

        return {
            "content": result_text,
            "sections": sections,
            "file_id": file_id,
            "task": task,
            "model": "moonshot-v1-128k",
            "tokens_used": data.get("usage", {}).get("total_tokens", 0),
        }

    async def process_bytes(
        self,
        file_bytes: bytes,
        filename: str = "document.pdf",
        task: str = "extract_and_structure",
        custom_prompt: str | None = None,
    ) -> dict:
        """Process document from bytes."""
        suffix = Path(filename).suffix or ".pdf"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            return await self.process_document(tmp_path, task, custom_prompt)
        finally:
            Path(tmp_path).unlink(missing_ok=True)


kimi_loader = KimiLoader()
