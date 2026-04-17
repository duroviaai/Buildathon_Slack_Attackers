import os
from datetime import timedelta

# Absolute path to the backend directory
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "mindforge-secret-key-2024")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mindforge-jwt-secret-2024")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(_BASE_DIR, 'database', 'db.sqlite3')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://127.0.0.1:5500", "http://localhost:5500", "null"]
