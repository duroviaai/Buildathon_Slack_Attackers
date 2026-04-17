import re
from flask import Blueprint, request, jsonify
from backend.services.auth_service import register_user, login_user

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role     = data.get("role") or "student"

    # Validation
    if not all([name, email, password]):
        return jsonify({"error": "All fields are required."}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"error": "Invalid email format."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if role not in ("student", "teacher"):
        return jsonify({"error": "Role must be student or teacher."}), 400

    user, error = register_user(name, email, password, role)
    if error:
        return jsonify({"error": error}), 409

    return jsonify({"message": "Account created successfully.", "user": user}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not all([email, password]):
        return jsonify({"error": "Email and password are required."}), 400

    token, user, error = login_user(email, password)
    if error:
        return jsonify({"error": error}), 401

    return jsonify({"token": token, "user": user}), 200
