from flask import Blueprint, request, jsonify
from concurrent.futures import ThreadPoolExecutor, TimeoutError
from backend.services.chatbot_service import get_ai_reply

chat_bp = Blueprint("chat", __name__)
_executor = ThreadPoolExecutor(max_workers=4)

@chat_bp.post("/chat")
def chat():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"reply": "⚠️ Empty message received."}), 400
    try:
        future = _executor.submit(get_ai_reply, message)
        reply = future.result(timeout=10)
    except TimeoutError:
        reply = "⚠️ Response timed out. Please try again."
    except Exception as e:
        reply = f"⚠️ Error: {str(e)}"
    return jsonify({"reply": reply})
