from datetime import date, timedelta
from ..extensions import db
from ..models.streak_model import Streak

XP_PER_DAY = 10

def get_or_create(user_id: int) -> Streak:
    streak = Streak.query.filter_by(user_id=user_id).first()
    if not streak:
        streak = Streak(user_id=user_id)
        db.session.add(streak)
        db.session.commit()
    return streak


def record_activity(user_id: int) -> Streak:
    """Call this whenever a user does something (chat, quiz, flashcard). Updates streak + XP."""
    streak = get_or_create(user_id)
    today = date.today()

    if streak.last_active == today:
        return streak  # already recorded today

    if streak.last_active == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    streak.total_days += 1
    streak.last_active = today
    streak.xp += XP_PER_DAY

    db.session.commit()
    return streak
