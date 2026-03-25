import base64
import tempfile
from pathlib import Path

from openai import OpenAI

from config.settings import settings


class ImageLoader:
    """Extract text/descriptions from images using GPT-4o Vision for RAG ingestion."""

    SUPPORTED_FORMATS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tiff"}

    def __init__(self):
        self._client: OpenAI | None = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.openai_api_key)
        return self._client

    def analyze(
        self,
        file_path: str,
        prompt: str | None = None,
        detail: str = "high",
    ) -> dict:
        """Analyze an image and extract text/description.

        Args:
            file_path: Path to the image file.
            prompt: Custom prompt for analysis. Defaults to general extraction.
            detail: 'low', 'high', or 'auto' for image detail level.

        Returns dict with 'description', 'extracted_text', and 'raw_response'.
        """
        path = Path(file_path)
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported image format: {path.suffix}. "
                f"Supported: {', '.join(self.SUPPORTED_FORMATS)}"
            )

        with open(file_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode("utf-8")

        mime_type = self._get_mime_type(path.suffix.lower())
        data_url = f"data:{mime_type};base64,{image_data}"

        return self._call_vision(data_url, prompt, detail)

    def analyze_bytes(
        self,
        image_bytes: bytes,
        filename: str = "image.png",
        prompt: str | None = None,
        detail: str = "high",
    ) -> dict:
        """Analyze image from bytes."""
        suffix = Path(filename).suffix or ".png"
        image_data = base64.b64encode(image_bytes).decode("utf-8")
        mime_type = self._get_mime_type(suffix.lower())
        data_url = f"data:{mime_type};base64,{image_data}"
        return self._call_vision(data_url, prompt, detail)

    def analyze_url(self, image_url: str, prompt: str | None = None, detail: str = "high") -> dict:
        """Analyze image from URL."""
        return self._call_vision(image_url, prompt, detail)

    def _call_vision(self, image_source: str, prompt: str | None, detail: str) -> dict:
        default_prompt = (
            "Analise esta imagem detalhadamente. Extraia:\n"
            "1. Todo texto visivel (OCR)\n"
            "2. Descricao do conteudo visual\n"
            "3. Se for um documento tecnico, manual ou diagnostico automotivo, "
            "extraia informacoes tecnicas relevantes\n"
            "4. Se houver graficos/tabelas, descreva os dados\n\n"
            "Responda em portugues brasileiro."
        )

        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt or default_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": image_source, "detail": detail},
                        },
                    ],
                }
            ],
            max_tokens=2048,
        )

        raw = response.choices[0].message.content
        return {
            "description": raw,
            "extracted_text": raw,  # Vision output is already text
            "model": "gpt-4o",
            "tokens_used": response.usage.total_tokens if response.usage else 0,
        }

    @staticmethod
    def _get_mime_type(suffix: str) -> str:
        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
            ".tiff": "image/tiff",
        }
        return mime_map.get(suffix, "image/png")


image_loader = ImageLoader()
