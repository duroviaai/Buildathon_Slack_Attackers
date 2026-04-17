import secrets
from backend.extensions import db, bcrypt
from backend.models.user_model import User

def register_user(name, email, password, role):
    if User.query.filter_by(email=email).first():
        return None, "Email already registered."
    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(name=name, email=email, password=hashed_pw, role=role)
    db.session.add(user)
    db.session.commit()
    return user.to_dict(), None


def login_user(email, password):
    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return None, None, "Invalid email or password."
    token = secrets.token_hex(32)
    return token, user.to_dict(), None
