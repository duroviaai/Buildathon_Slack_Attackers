from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.user_model import User
from ..models.quiz_model import QuizAttempt

user_bp = Blueprint("user", __name__)


@user_bp.get("/user/me")
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@user_bp.post("/quiz/attempts")
@jwt_required()
def save_quiz_attempt():
    user_id = int(get_jwt_identity())
    data    = request.get_json(silent=True) or {}
    score   = data.get("score", 0)
    total   = data.get("total", 0)
    title   = (data.get("title") or "Quiz").strip()

    if not isinstance(score, int) or not isinstance(total, int) or total <= 0:
        return jsonify({"error": "Invalid score/total."}), 400

    attempt = QuizAttempt(user_id=user_id, title=title, score=score, total=total)
    db.session.add(attempt)
    db.session.commit()

    # Also ping streak
    from ..services.streak_service import record_activity
    record_activity(user_id)

    return jsonify(attempt.to_dict()), 201


@user_bp.get("/quiz/attempts")
@jwt_required()
def list_quiz_attempts():
    user_id = int(get_jwt_identity())
    attempts = QuizAttempt.query.filter_by(user_id=user_id).order_by(QuizAttempt.created_at.desc()).all()
    return jsonify([a.to_dict() for a in attempts])
