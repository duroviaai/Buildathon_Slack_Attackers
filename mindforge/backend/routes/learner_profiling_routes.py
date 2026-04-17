from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models.learner_profile_model import LearnerProfile

learner_profiling_bp = Blueprint("learner_profiling", __name__)

VALID_SUBJECTS = {"Programming", "Mathematics", "Science", "Exam Preparation", "Other"}
VALID_LEVELS = {"Beginner", "Intermediate", "Advanced"}
VALID_DURATIONS = {"2–3 min", "5–7 min", "10+ min"}
VALID_STYLES = {"Simple explanations", "Step-by-step examples", "Practice questions", "Visual / real-life examples"}
VALID_DIFFICULTIES = {"Start easy", "Moderate difficulty", "Challenge me"}
VALID_CONFIDENCES = {"Not confident", "Somewhat confident", "Very confident"}


@learner_profiling_bp.route("", methods=["POST"])
@jwt_required()
def save_profile():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    name       = (data.get("name") or "").strip()
    subject    = data.get("subject", "")
    level      = data.get("level", "")
    duration   = data.get("duration", "")
    style      = data.get("style", "")
    difficulty = data.get("difficulty", "")
    confidence = data.get("confidence", "")

    if not name:
        return jsonify({"error": "Name is required."}), 400
    if subject not in VALID_SUBJECTS:
        return jsonify({"error": "Invalid subject."}), 400
    if level not in VALID_LEVELS:
        return jsonify({"error": "Invalid level."}), 400
    if duration not in VALID_DURATIONS:
        return jsonify({"error": "Invalid duration."}), 400
    if style not in VALID_STYLES:
        return jsonify({"error": "Invalid style."}), 400
    if difficulty not in VALID_DIFFICULTIES:
        return jsonify({"error": "Invalid difficulty."}), 400
    if confidence not in VALID_CONFIDENCES:
        return jsonify({"error": "Invalid confidence."}), 400

    profile = LearnerProfile.query.filter_by(user_id=user_id).first()
    if profile:
        profile.name       = name
        profile.subject    = subject
        profile.level      = level
        profile.duration   = duration
        profile.style      = style
        profile.difficulty = difficulty
        profile.confidence = confidence
    else:
        profile = LearnerProfile(
            user_id=user_id, name=name, subject=subject, level=level,
            duration=duration, style=style, difficulty=difficulty, confidence=confidence
        )
        db.session.add(profile)

    db.session.commit()
    return jsonify({"message": "Profile saved.", "profile": profile.to_dict()}), 200


@learner_profiling_bp.route("", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    profile = LearnerProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({"error": "Profile not found."}), 404
    return jsonify({"profile": profile.to_dict()}), 200
