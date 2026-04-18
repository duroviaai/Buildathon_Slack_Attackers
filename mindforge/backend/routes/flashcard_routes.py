from flask import Blueprint, request, jsonify
from openai import RateLimitError
from backend.services.flashcard_service import generate_flashcards
from backend.services.ocr_service import extract_text_from_file

flashcard_bp = Blueprint("flashcards", __name__)

@flashcard_bp.post("/flashcards/generate")
def flashcards_generate():
    count = 10
    text = ""

    if request.content_type and "multipart/form-data" in request.content_type:
        text = (request.form.get("notes") or "").strip()
        try:
            count = int(request.form.get("count") or 10)
        except (ValueError, TypeError):
            count = 10
        f = request.files.get("file")
        if f:
            extracted = extract_text_from_file(f)
            if extracted:
                text += "\n\n" + extracted[:4000]
    else:
        data = request.get_json(silent=True) or {}
        text = (data.get("notes") or data.get("text") or "").strip()
        try:
            count = int(data.get("count") or 10)
        except (ValueError, TypeError):
            count = 10

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        cards = generate_flashcards(text, count)
        return jsonify({"flashcards": cards, "title": f"Flashcard Set ({len(cards)} cards)"})
    except RateLimitError as e:
        return jsonify({"error": "The AI service is busy. Please wait a moment and try again."}), 429
    except Exception as e:
        return jsonify({"error": str(e)}), 500
