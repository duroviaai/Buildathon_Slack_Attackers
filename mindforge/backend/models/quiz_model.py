from datetime import datetime, timezone
from ..extensions import db

class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title        = db.Column(db.String(255), nullable=False, default="Quiz")
    score        = db.Column(db.Integer, nullable=False, default=0)
    total        = db.Column(db.Integer, nullable=False, default=0)
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        pct = round((self.score / self.total) * 100) if self.total else 0
        return {
            "id":         self.id,
            "title":      self.title,
            "score":      self.score,
            "total":      self.total,
            "percent":    pct,
            "created_at": self.created_at.isoformat(),
        }
