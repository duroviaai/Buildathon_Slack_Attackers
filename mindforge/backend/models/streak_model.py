from datetime import datetime, timezone, date
from ..extensions import db

class Streak(db.Model):
    __tablename__ = "streaks"

    id              = db.Column(db.Integer, primary_key=True)
    user_id         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    current_streak  = db.Column(db.Integer, nullable=False, default=0)
    longest_streak  = db.Column(db.Integer, nullable=False, default=0)
    total_days      = db.Column(db.Integer, nullable=False, default=0)
    last_active     = db.Column(db.Date, nullable=True)
    xp              = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "total_days":     self.total_days,
            "last_active":    self.last_active.isoformat() if self.last_active else None,
            "xp":             self.xp,
        }
