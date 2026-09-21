from datetime import datetime, date
from app.extensions import db
from app.models.savings import SavingsGoal, SavingsDeposit

def get_savings_goals(user_id: str):
    goals = SavingsGoal.query.filter_by(user_id=user_id).order_by(SavingsGoal.created_at.desc()).all()
    
    total_target = sum(float(g.target_amount) for g in goals)
    total_saved = sum(float(g.current_amount) for g in goals)
    overall_percentage = round((total_saved / total_target * 100.0), 1) if total_target > 0 else 0.0

    return {
        "summary": {
            "total_goals": len(goals),
            "total_target": total_target,
            "total_saved": total_saved,
            "total_remaining": max(0.0, total_target - total_saved),
            "overall_percentage": min(100.0, overall_percentage),
            "completed_goals": sum(1 for g in goals if float(g.current_amount) >= float(g.target_amount))
        },
        "goals": [g.to_dict() for g in goals]
    }, 200

def create_savings_goal(
    user_id: str,
    title: str,
    target_amount: float,
    initial_amount: float = 0.0,
    target_date: str = None,
    color: str = "#10B981",
    icon: str = "PiggyBank"
):
    title = (title or "").strip()
    if not title:
        return {"error": "Goal title is required."}, 400

    try:
        target_num = float(target_amount)
        if target_num <= 0:
            return {"error": "Target amount must be greater than zero."}, 400
    except (ValueError, TypeError):
        return {"error": "Invalid target amount specified."}, 400

    try:
        initial_num = float(initial_amount) if initial_amount else 0.0
        if initial_num < 0:
            return {"error": "Initial deposit cannot be negative."}, 400
    except (ValueError, TypeError):
        initial_num = 0.0

    t_date = None
    if target_date:
        try:
            t_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Invalid date format for target date. Expected YYYY-MM-DD."}, 400

    goal = SavingsGoal(
        user_id=user_id,
        title=title,
        target_amount=target_num,
        current_amount=initial_num,
        target_date=t_date,
        color=color or "#10B981",
        icon=icon or "PiggyBank"
    )
    db.session.add(goal)
    db.session.flush()

    # If there was an initial deposit, record it in history
    if initial_num > 0:
        deposit = SavingsDeposit(
            user_id=user_id,
            goal_id=goal.id,
            amount=initial_num,
            note="Initial deposit",
            deposit_date=date.today()
        )
        db.session.add(deposit)

    db.session.commit()
    return {"goal": goal.to_dict()}, 201

def update_savings_goal(
    user_id: str,
    goal_id: str,
    title: str = None,
    target_amount: float = None,
    target_date: str = None,
    color: str = None,
    icon: str = None
):
    goal = db.session.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != user_id:
        return {"error": "Savings goal not found."}, 404

    if title:
        title = title.strip()
        if not title:
            return {"error": "Title cannot be empty."}, 400
        goal.title = title

    if target_amount is not None:
        try:
            target_num = float(target_amount)
            if target_num <= 0:
                return {"error": "Target amount must be greater than zero."}, 400
            goal.target_amount = target_num
        except (ValueError, TypeError):
            return {"error": "Invalid target amount specified."}, 400

    if target_date is not None:
        if target_date:
            try:
                goal.target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
            except ValueError:
                return {"error": "Invalid date format. Expected YYYY-MM-DD."}, 400
        else:
            goal.target_date = None

    if color:
        goal.color = color.strip()
    if icon:
        goal.icon = icon.strip()

    db.session.commit()
    return {"goal": goal.to_dict()}, 200

def delete_savings_goal(user_id: str, goal_id: str):
    goal = db.session.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != user_id:
        return {"error": "Savings goal not found."}, 404

    db.session.delete(goal)
    db.session.commit()
    return {"message": "Savings goal deleted successfully."}, 200

def add_savings_deposit(user_id: str, goal_id: str, amount: float, note: str = None, deposit_date: str = None):
    goal = db.session.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != user_id:
        return {"error": "Savings goal not found."}, 404

    try:
        amt_num = float(amount)
        if amt_num <= 0:
            return {"error": "Deposit amount must be greater than zero."}, 400
    except (ValueError, TypeError):
        return {"error": "Invalid deposit amount."}, 400

    d_date = date.today()
    if deposit_date:
        try:
            d_date = datetime.strptime(deposit_date, "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Invalid date format. Expected YYYY-MM-DD."}, 400

    deposit = SavingsDeposit(
        user_id=user_id,
        goal_id=goal_id,
        amount=amt_num,
        note=(note or "").strip() or None,
        deposit_date=d_date
    )
    db.session.add(deposit)

    # Increment goal's current amount
    goal.current_amount = float(goal.current_amount) + amt_num
    db.session.commit()

    return {
        "deposit": deposit.to_dict(),
        "goal": goal.to_dict()
    }, 201

def get_savings_deposits(user_id: str, goal_id: str):
    goal = db.session.get(SavingsGoal, goal_id)
    if not goal or goal.user_id != user_id:
        return {"error": "Savings goal not found."}, 404

    deposits = SavingsDeposit.query.filter_by(goal_id=goal_id, user_id=user_id).order_by(SavingsDeposit.deposit_date.desc(), SavingsDeposit.created_at.desc()).all()
    return {"deposits": [d.to_dict() for d in deposits]}, 200
