from flask_jwt_extended import create_access_token
from ..extensions import db, bcrypt
from ..models.user_model import User

def register_user(name, email, password, role):
    """Register a new user. Returns (user_dict, error_message)."""
    if User.query.filter_by(email=email).first():
        return None, "Email already registered."

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, email=email, password=hashed_pw, role=role)
    db.session.add(user)
    db.session.commit()
    return user.to_dict(), None


def login_user(email, password):
    """Authenticate user and return JWT token. Returns (token, user_dict, error_message)."""
    user = User.query.filter_by(email=email).first()

    if not user or not bcrypt.check_password_hash(user.password, password):
        return None, None, "Invalid email or password."

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "name": user.name}
    )
    return token, user.to_dict(), None
