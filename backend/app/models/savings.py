import uuid
from datetime import datetime, timezone, date
from app.extensions import db

class SavingsGoal(db.Model):
    __tablename__ = "savings_goals"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = db.Column(db.String(120), nullable=False)
    target_amount = db.Column(db.Numeric(12, 2), nullable=False)
    current_amount = db.Column(db.Numeric(12, 2), default=0.0, nullable=False)
    target_date = db.Column(db.Date, nullable=True)
    color = db.Column(db.String(20), default="#10B981", nullable=False)
    icon = db.Column(db.String(50), default="PiggyBank", nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = db.relationship("User", backref=db.backref("savings_goals", lazy="dynamic", cascade="all, delete-orphan"))
    deposits = db.relationship("SavingsDeposit", back_populates="goal", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self):
        target = float(self.target_amount)
        current = float(self.current_amount)
        pct = round((current / target * 100.0), 1) if target > 0 else 0.0
        remaining = max(0.0, target - current)

        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_amount": target,
            "current_amount": current,
            "remaining_amount": remaining,
            "percentage_completed": min(100.0, pct),
            "is_completed": current >= target,
            "target_date": self.target_date.isoformat() if self.target_date else None,
            "color": self.color,
            "icon": self.icon,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class SavingsDeposit(db.Model):
    __tablename__ = "savings_deposits"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = db.Column(db.String(36), db.ForeignKey("savings_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    note = db.Column(db.String(255), nullable=True)
    deposit_date = db.Column(db.Date, default=date.today, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    goal = db.relationship("SavingsGoal", back_populates="deposits")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "goal_id": self.goal_id,
            "amount": float(self.amount),
            "note": self.note,
            "deposit_date": self.deposit_date.isoformat() if self.deposit_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
