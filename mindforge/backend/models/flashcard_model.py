from datetime import datetime, timezone
from ..extensions import db

class FlashcardSet(db.Model):
    __tablename__ = "flashcard_sets"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title      = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    cards = db.relationship("Flashcard", backref="set", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id":         self.id,
            "title":      self.title,
            "card_count": len(self.cards),
            "created_at": self.created_at.isoformat(),
        }


class Flashcard(db.Model):
    __tablename__ = "flashcards"

    id     = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey("flashcard_sets.id"), nullable=False)
    front  = db.Column(db.Text, nullable=False)
    back   = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {"id": self.id, "front": self.front, "back": self.back}
