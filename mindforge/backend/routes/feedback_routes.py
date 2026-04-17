from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from ..extensions import db
from ..models.feedback_model import Feedback

feedback_bp = Blueprint("feedback", __name__)


@feedback_bp.post("/feedback")
def submit_feedback():
    data     = request.get_json(silent=True) or {}
    rating   = data.get("rating")
    category = data.get("category", "general")
    message  = (data.get("message") or "").strip()

    if not isinstance(rating, int) or not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be an integer between 1 and 5."}), 400
    if category not in ("general", "bug", "feature", "content"):
        category = "general"

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        pass

    fb = Feedback(user_id=user_id, rating=rating, category=category, message=message)
    db.session.add(fb)
    db.session.commit()
    return jsonify({"message": "Feedback submitted. Thank you!"}), 201


@feedback_bp.get("/feedback")
@jwt_required()
def list_feedback():
    from flask_jwt_extended import get_jwt
    if get_jwt().get("role") != "teacher":
        return jsonify({"error": "Teacher access required."}), 403
    items = Feedback.query.order_by(Feedback.created_at.desc()).limit(100).all()
    return jsonify([f.to_dict() for f in items])
