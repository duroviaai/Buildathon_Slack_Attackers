from flask_jwt_extended import create_access_token
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from ..extensions import db, bcrypt
from ..models.user_model import User
import os

def _make_token(user):
    return create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name}
    )


def register_user(name, email, password, role):
    """Register a new user. Returns (user_dict, error_message)."""
    if User.query.filter_by(email=email).first():
        return None, "Email already registered."

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, email=email, password=hashed_pw, role=role)
    db.session.add(user)
    db.session.commit()
    return user.to_dict(), None


def reset_user_password(email: str, new_password: str):
    """Update password for existing user. Returns error string or None."""
    user = User.query.filter_by(email=email).first()
    if not user:
        return "User not found."
    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    db.session.commit()
    return None


def login_user(email, password):
    """Authenticate user and return JWT token. Returns (token, user_dict, error_message)."""
    user = User.query.filter_by(email=email).first()

    if not user or not user.password or not bcrypt.check_password_hash(user.password, password):
        return None, None, "Invalid email or password."

    return _make_token(user), user.to_dict(), None


def google_auth_user(credential, name, role):
    """Verify Google ID token, create/login user. Returns (token, user_dict, error_message)."""
    try:
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        info = id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError as e:
        return None, None, f"Invalid Google token: {e}"

    google_id = info["sub"]
    email = info.get("email", "").lower()

    user = User.query.filter_by(google_id=google_id).first()
    if not user:
        user = User.query.filter_by(email=email).first()
        if user:
            user.google_id = google_id
        else:
            if not name:
                return None, None, "NEEDS_NAME"
            user = User(name=name, email=email, password=None, google_id=google_id, role=role)
            db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return None, None, str(e)
    return _make_token(user), user.to_dict(), None
