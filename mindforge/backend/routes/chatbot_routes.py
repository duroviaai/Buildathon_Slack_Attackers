import json, re
from flask import Blueprint, request, jsonify
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from backend.services.chatbot_service import get_ai_reply, _client
from backend.services.ocr_service import extract_text_from_file
from backend.services.speech_service import transcribe_audio

chat_bp = Blueprint("chat", __name__)
_executor = ThreadPoolExecutor(max_workers=4)

@chat_bp.post("/chat")
def chat():
    file_context = ""

    # Multipart (file upload)
    if request.content_type and "multipart/form-data" in request.content_type:
        message = (request.form.get("message") or "").strip()
        f = request.files.get("file")
        if f:
            extracted = extract_text_from_file(f)
            if extracted:
                file_context = f"\n\n[Attached file content]:\n{extracted[:4000]}"
    else:
        data = request.get_json(silent=True) or {}
        message = (data.get("message") or "").strip()

    if not message and not file_context:
        return jsonify({"reply": "⚠️ Empty message received."}), 400

    full_message = (message or "Summarize or answer based on the attached content.") + file_context

    try:
        future = _executor.submit(get_ai_reply, full_message)
        reply = future.result(timeout=30)
    except TimeoutError:
        reply = "⚠️ Response timed out. Please try again."
    except Exception as e:
        reply = f"⚠️ Error: {str(e)}"

    return jsonify({"reply": reply})


@chat_bp.post("/generate-flashcards")
def generate_flashcards():
    text = (request.get_json(silent=True) or {}).get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    prompt = (
        f"Generate 5 flashcards from the text below. "
        f"Return ONLY a JSON array like: "
        f'[{{"term":"...","definition":"..."}}]. No markdown, no explanation.\n\n{text[:3000]}'
    )
    try:
        resp = _client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5, max_tokens=800
        )
        raw = resp.choices[0].message.content.strip()
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        cards = json.loads(match.group()) if match else []
        return jsonify({"flashcards": cards})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.post("/generate-quiz")
def generate_quiz():
    text = (request.get_json(silent=True) or {}).get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
    prompt = (
        f"Generate 5 multiple-choice questions from the text below. "
        f"Return ONLY a JSON array like: "
        f'[{{"question":"...","options":["A","B","C","D"],"correct_index":0}}]. '
        f"No markdown, no explanation.\n\n{text[:3000]}"
    )
    try:
        resp = _client.chat.completions.create(
            model="Meta-Llama-3.3-70B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5, max_tokens=1200
        )
        raw = resp.choices[0].message.content.strip()
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        questions = json.loads(match.group()) if match else []
        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.post("/transcribe")
def transcribe():
    f = request.files.get("audio")
    if not f:
        return jsonify({"error": "No audio file"}), 400
    mime = f.content_type or "audio/webm"
    try:
        text = transcribe_audio(f.read(), mime)
        return jsonify({"transcript": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
