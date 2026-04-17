from datetime import datetime, timezone
from ..extensions import db

class Feedback(db.Model):
    __tablename__ = "feedback"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    rating     = db.Column(db.Integer, nullable=False)   # 1–5
    category   = db.Column(db.String(50), nullable=False, default="general")
    message    = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":         self.id,
            "rating":     self.rating,
            "category":   self.category,
            "message":    self.message,
            "created_at": self.created_at.isoformat(),
        }
