from flask import Blueprint, request, jsonify
from backend.services.quiz_service import generate_quiz
from backend.services.ocr_service import extract_text_from_file

quiz_bp = Blueprint("quiz", __name__)

@quiz_bp.post("/quiz/generate")
def quiz_generate():
    text = ""
    count = 10

    if request.content_type and "multipart/form-data" in request.content_type:
        text = (request.form.get("notes") or "").strip()
        count = int(request.form.get("count", 10))
        f = request.files.get("file")
        if f:
            extracted = extract_text_from_file(f)
            if extracted:
                text += "\n\n" + extracted[:4000]
    else:
        data = request.get_json(silent=True) or {}
        text = (data.get("notes") or data.get("text") or "").strip()
        count = int(data.get("count", 10))

    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        questions = generate_quiz(text, count)
        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
