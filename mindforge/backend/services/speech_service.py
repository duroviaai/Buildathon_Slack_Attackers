import os
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or os.getenv("SAMBANOVA_API_KEY"))

def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm") -> str:
    ext = "webm"
    if "ogg" in mime_type:   ext = "ogg"
    elif "mp4" in mime_type: ext = "mp4"
    elif "wav" in mime_type: ext = "wav"

    with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            result = _client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="text"
            )
        return (result or "").strip()
    finally:
        os.unlink(tmp_path)
