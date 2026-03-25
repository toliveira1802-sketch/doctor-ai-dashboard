import tempfile
from pathlib import Path

from openai import OpenAI

from config.settings import settings


class AudioLoader:
    """Transcribe audio files using OpenAI Whisper, then prepare for RAG ingestion."""

    SUPPORTED_FORMATS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm", ".ogg", ".flac"}

    def __init__(self):
        self._client: OpenAI | None = None

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            self._client = OpenAI(api_key=settings.openai_api_key)
        return self._client

    def transcribe(self, file_path: str, language: str = "pt") -> dict:
        """Transcribe an audio file to text.

        Returns dict with 'text' (full transcription) and 'segments' (timestamped chunks).
        """
        path = Path(file_path)
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported audio format: {path.suffix}. "
                f"Supported: {', '.join(self.SUPPORTED_FORMATS)}"
            )

        with open(file_path, "rb") as audio_file:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language=language,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )

        segments = []
        if hasattr(response, "segments") and response.segments:
            for seg in response.segments:
                segments.append({
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", "").strip(),
                })

        return {
            "text": response.text,
            "segments": segments,
            "duration": response.duration if hasattr(response, "duration") else None,
            "language": language,
        }

    def transcribe_bytes(self, audio_bytes: bytes, filename: str = "audio.mp3", language: str = "pt") -> dict:
        """Transcribe audio from bytes."""
        suffix = Path(filename).suffix or ".mp3"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            return self.transcribe(tmp_path, language)
        finally:
            Path(tmp_path).unlink(missing_ok=True)


audio_loader = AudioLoader()
