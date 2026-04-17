import re
from flask import Blueprint, request, jsonify
from ..services.auth_service import register_user, login_user, google_auth_user, reset_user_password
from ..services.otp_service import send_otp, verify_otp
from ..models.user_model import User

auth_bp = Blueprint("auth", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role     = data.get("role") or "student"

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


@auth_bp.route("/google", methods=["POST"])
def google_auth():
    data       = request.get_json(silent=True) or {}
    credential = data.get("credential") or ""
    name       = (data.get("name") or "").strip()
    role       = data.get("role") or "student"

    if not credential:
        return jsonify({"error": "Google credential is required."}), 400
    if role not in ("student", "teacher"):
        role = "student"

    token, user, error = google_auth_user(credential, name, role)
    if error == "NEEDS_NAME":
        return jsonify({"error": "NEEDS_NAME"}), 202
    if error:
        return jsonify({"error": error}), 401
    return jsonify({"token": token, "user": user}), 200


@auth_bp.route("/send-otp", methods=["POST"])
def send_otp_route():
    data    = request.get_json(silent=True) or {}
    email   = (data.get("email") or "").strip().lower()
    purpose = data.get("purpose") or "register"

    if not email or not EMAIL_RE.match(email):
        return jsonify({"error": "Valid email is required."}), 400
    if purpose not in ("register", "reset"):
        return jsonify({"error": "Invalid purpose."}), 400

    if purpose == "register" and User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered."}), 409
    if purpose == "reset" and not User.query.filter_by(email=email).first():
        return jsonify({"error": "No account found with this email."}), 404

    ok, err = send_otp(email, purpose)
    if not ok:
        return jsonify({"error": f"Failed to send email: {err}"}), 500
    return jsonify({"message": "OTP sent."}), 200


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp_route():
    data    = request.get_json(silent=True) or {}
    email   = (data.get("email") or "").strip().lower()
    otp     = (data.get("otp") or "").strip()
    purpose = data.get("purpose") or "register"

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required."}), 400

    valid, err = verify_otp(email, otp, purpose)
    if not valid:
        return jsonify({"error": err}), 400
    return jsonify({"message": "OTP verified."}), 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    otp      = (data.get("otp") or "").strip()
    password = data.get("password") or ""

    if not all([email, otp, password]):
        return jsonify({"error": "All fields are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    valid, err = verify_otp(email, otp, "reset")
    if not valid:
        return jsonify({"error": err}), 400

    error = reset_user_password(email, password)
    if error:
        return jsonify({"error": error}), 400
    return jsonify({"message": "Password reset successful."}), 200
