from datetime import datetime, timezone
from ..extensions import db

class LearnerProfile(db.Model):
    __tablename__ = "learner_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    name = db.Column(db.String(120), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    level = db.Column(db.String(20), nullable=False)
    duration = db.Column(db.String(20), nullable=False)
    style = db.Column(db.String(50), nullable=False)
    difficulty = db.Column(db.String(30), nullable=False)
    confidence = db.Column(db.String(30), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "subject": self.subject,
            "level": self.level,
            "duration": self.duration,
            "style": self.style,
            "difficulty": self.difficulty,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }
