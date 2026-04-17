import re
import os
import requests as http_requests
from flask import Blueprint, request, jsonify, redirect
from ..services.auth_service import register_user, login_user, google_auth_user, reset_user_password
from ..services.otp_service import send_otp, verify_otp
from ..models.user_model import User

auth_bp = Blueprint("auth", __name__)

GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID", "554482016091-elsto1gd07q56t9ni97ho43rgjvvmh59.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = "http://127.0.0.1:5000/api/auth/google/callback"

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


@auth_bp.route("/google/callback", methods=["GET"])
def google_callback():
    code = request.args.get("code")
    if not code:
        return _popup_result(None, None, "No code returned from Google.")

    # Exchange code for tokens
    token_res = http_requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    })
    token_data = token_res.json()
    id_token_str = token_data.get("id_token")
    if not id_token_str:
        return _popup_result(None, None, token_data.get("error_description", "Token exchange failed."))

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests
    try:
        info = google_id_token.verify_oauth2_token(id_token_str, google_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError as e:
        return _popup_result(None, None, str(e))

    google_id = info["sub"]
    email     = info.get("email", "").lower()
    name      = info.get("name", "") or email.split("@")[0]

    from ..services.auth_service import _make_token
    from ..extensions import db
    user = User.query.filter_by(google_id=google_id).first()
    if not user:
        user = User.query.filter_by(email=email).first()
        if user:
            user.google_id = google_id
        else:
            user = User(name=name, email=email, password=None, google_id=google_id, role="student")
            db.session.add(user)
    db.session.commit()

    jwt_token = _make_token(user)
    return _popup_result(jwt_token, user.to_dict(), None)


def _popup_result(token, user, error):
    """Returns an HTML page that sends result to opener via postMessage then closes."""
    if error:
        payload = f'{{"error": "{error}"}}'
    else:
        import json
        payload = json.dumps({"token": token, "user": user})
    html = f"""<!DOCTYPE html><html><body><script>
  window.opener && window.opener.postMessage({payload}, 'http://127.0.0.1:5000');
  window.close();
</script></body></html>"""
    from flask import make_response
    resp = make_response(html, 200)
    resp.headers["Content-Type"] = "text/html"
    return resp


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
