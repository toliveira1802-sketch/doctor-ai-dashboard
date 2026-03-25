import base64
import subprocess
import tempfile
from pathlib import Path

from config.settings import settings
from ingestion.audio_loader import audio_loader
from ingestion.image_loader import image_loader


class VideoLoader:
    """Extract content from videos: audio transcription + frame analysis for RAG ingestion."""

    SUPPORTED_FORMATS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}

    def analyze(
        self,
        file_path: str,
        extract_frames: int = 5,
        language: str = "pt",
    ) -> dict:
        """Analyze a video by extracting audio + key frames.

        Args:
            file_path: Path to the video file.
            extract_frames: Number of frames to extract for visual analysis.
            language: Language for audio transcription.

        Returns dict with 'transcription', 'frame_analyses', and 'combined_text'.
        """
        path = Path(file_path)
        if path.suffix.lower() not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported video format: {path.suffix}. "
                f"Supported: {', '.join(self.SUPPORTED_FORMATS)}"
            )

        results = {
            "transcription": None,
            "frame_analyses": [],
            "combined_text": "",
        }

        # 1. Extract and transcribe audio
        try:
            audio_path = self._extract_audio(file_path)
            if audio_path:
                results["transcription"] = audio_loader.transcribe(audio_path, language)
                Path(audio_path).unlink(missing_ok=True)
        except Exception as e:
            results["transcription"] = {"error": str(e), "text": ""}

        # 2. Extract and analyze key frames
        try:
            frame_paths = self._extract_frames(file_path, extract_frames)
            for i, frame_path in enumerate(frame_paths):
                try:
                    analysis = image_loader.analyze(
                        frame_path,
                        prompt=(
                            f"Este e o frame {i + 1} de {len(frame_paths)} de um video. "
                            "Descreva o que voce ve, focando em conteudo tecnico automotivo "
                            "se aplicavel. Responda em portugues."
                        ),
                    )
                    results["frame_analyses"].append({
                        "frame_index": i,
                        "description": analysis["description"],
                    })
                except Exception as e:
                    results["frame_analyses"].append({
                        "frame_index": i,
                        "error": str(e),
                    })
                finally:
                    Path(frame_path).unlink(missing_ok=True)
        except Exception as e:
            results["frame_analyses"] = [{"error": str(e)}]

        # 3. Combine all text
        parts = []
        if results["transcription"] and results["transcription"].get("text"):
            parts.append(f"## Transcricao do Audio\n{results['transcription']['text']}")
        for fa in results["frame_analyses"]:
            if fa.get("description"):
                parts.append(
                    f"## Analise Visual (Frame {fa.get('frame_index', 0) + 1})\n{fa['description']}"
                )
        results["combined_text"] = "\n\n".join(parts)

        return results

    def analyze_bytes(
        self,
        video_bytes: bytes,
        filename: str = "video.mp4",
        extract_frames: int = 5,
        language: str = "pt",
    ) -> dict:
        """Analyze video from bytes."""
        suffix = Path(filename).suffix or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            return self.analyze(tmp_path, extract_frames, language)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    @staticmethod
    def _extract_audio(video_path: str) -> str | None:
        """Extract audio track from video using ffmpeg."""
        output = tempfile.mktemp(suffix=".mp3")
        try:
            subprocess.run(
                [
                    "ffmpeg", "-i", video_path,
                    "-vn", "-acodec", "libmp3lame", "-q:a", "4",
                    "-y", output,
                ],
                capture_output=True,
                timeout=300,
                check=True,
            )
            return output if Path(output).exists() and Path(output).stat().st_size > 0 else None
        except (subprocess.CalledProcessError, FileNotFoundError):
            Path(output).unlink(missing_ok=True)
            return None

    @staticmethod
    def _extract_frames(video_path: str, num_frames: int = 5) -> list[str]:
        """Extract evenly-spaced frames from video using ffmpeg."""
        output_dir = tempfile.mkdtemp()
        try:
            # Get video duration
            result = subprocess.run(
                [
                    "ffprobe", "-v", "error",
                    "-show_entries", "format=duration",
                    "-of", "default=noprint_wrappers=1:nokey=1",
                    video_path,
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )
            duration = float(result.stdout.strip()) if result.stdout.strip() else 60
            interval = max(duration / (num_frames + 1), 1)

            frames = []
            for i in range(num_frames):
                timestamp = interval * (i + 1)
                output_path = f"{output_dir}/frame_{i:03d}.jpg"
                subprocess.run(
                    [
                        "ffmpeg", "-ss", str(timestamp),
                        "-i", video_path,
                        "-vframes", "1", "-q:v", "2",
                        "-y", output_path,
                    ],
                    capture_output=True,
                    timeout=30,
                )
                if Path(output_path).exists():
                    frames.append(output_path)

            return frames
        except (subprocess.CalledProcessError, FileNotFoundError):
            return []


video_loader = VideoLoader()
