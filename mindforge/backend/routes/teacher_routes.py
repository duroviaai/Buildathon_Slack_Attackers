from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models.user_model import User
from ..models.notes_model import Note
from ..models.quiz_model import QuizAttempt
from ..models.streak_model import Streak

teacher_bp = Blueprint("teacher", __name__)


def _require_teacher():
    claims = get_jwt()
    return claims.get("role") == "teacher"


@teacher_bp.get("/teacher/students")
@jwt_required()
def list_students():
    if not _require_teacher():
        return jsonify({"error": "Teacher access required."}), 403

    students = User.query.filter_by(role="student").all()
    result = []
    for s in students:
        note_count = Note.query.filter_by(user_id=s.id).count()
        quiz_count = QuizAttempt.query.filter_by(user_id=s.id).count()
        streak = Streak.query.filter_by(user_id=s.id).first()
        result.append({
            **s.to_dict(),
            "note_count":  note_count,
            "quiz_count":  quiz_count,
            "streak":      streak.current_streak if streak else 0,
            "xp":          streak.xp if streak else 0,
        })
    return jsonify(result)


@teacher_bp.get("/teacher/students/<int:student_id>/notes")
@jwt_required()
def student_notes(student_id):
    if not _require_teacher():
        return jsonify({"error": "Teacher access required."}), 403
    notes = Note.query.filter_by(user_id=student_id).order_by(Note.updated_at.desc()).all()
    return jsonify([n.to_dict() for n in notes])


@teacher_bp.get("/teacher/students/<int:student_id>/quizzes")
@jwt_required()
def student_quizzes(student_id):
    if not _require_teacher():
        return jsonify({"error": "Teacher access required."}), 403
    attempts = QuizAttempt.query.filter_by(user_id=student_id).order_by(QuizAttempt.created_at.desc()).all()
    return jsonify([a.to_dict() for a in attempts])


@teacher_bp.get("/teacher/stats")
@jwt_required()
def teacher_stats():
    if not _require_teacher():
        return jsonify({"error": "Teacher access required."}), 403
    total_students = User.query.filter_by(role="student").count()
    total_notes    = Note.query.count()
    total_quizzes  = QuizAttempt.query.count()
    return jsonify({
        "total_students": total_students,
        "total_notes":    total_notes,
        "total_quizzes":  total_quizzes,
    })
