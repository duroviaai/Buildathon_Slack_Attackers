from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.streak_service import get_or_create, record_activity

streak_bp = Blueprint("streak", __name__)


@streak_bp.get("/streak")
@jwt_required()
def get_streak():
    user_id = int(get_jwt_identity())
    streak = get_or_create(user_id)
    return jsonify(streak.to_dict())


@streak_bp.post("/streak/ping")
@jwt_required()
def ping_streak():
    """Call this from the frontend on any learning activity."""
    user_id = int(get_jwt_identity())
    streak = record_activity(user_id)
    return jsonify(streak.to_dict())
