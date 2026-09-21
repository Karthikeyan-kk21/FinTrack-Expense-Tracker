from datetime import date
from sqlalchemy import func, extract
from app.extensions import db
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction

def get_budgets(user_id: str, month: int = None, year: int = None):
    today = date.today()
    target_month = int(month) if month else today.month
    target_year = int(year) if year else today.year

    # Fetch all budgets for this user and period
    budgets = Budget.query.filter_by(
        user_id=user_id,
        month=target_month,
        year=target_year
    ).all()

    # Query sum of expenses grouped by category_id for this month & year
    expense_sums = db.session.query(
        Transaction.category_id,
        func.coalesce(func.sum(Transaction.amount), 0).label("total_spent")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        extract("month", Transaction.transaction_date) == target_month,
        extract("year", Transaction.transaction_date) == target_year
    ).group_by(Transaction.category_id).all()

    spent_map = {category_id: float(total_spent) for category_id, total_spent in expense_sums}

    total_budgeted = 0.0
    total_spent_in_budgets = 0.0
    budget_list = []

    for b in budgets:
        limit_amt = float(b.amount)
        spent_amt = spent_map.get(b.category_id, 0.0)
        remaining = max(0.0, limit_amt - spent_amt)
        pct = round((spent_amt / limit_amt * 100.0), 1) if limit_amt > 0 else 0.0
        is_exceeded = spent_amt > limit_amt
        over_amt = max(0.0, spent_amt - limit_amt)

        total_budgeted += limit_amt
        total_spent_in_budgets += spent_amt

        item = b.to_dict()
        item.update({
            "spent_amount": spent_amt,
            "remaining_amount": remaining,
            "percentage_used": pct,
            "is_exceeded": is_exceeded,
            "over_amount": over_amt
        })
        budget_list.append(item)

    overall_percentage = round((total_spent_in_budgets / total_budgeted * 100.0), 1) if total_budgeted > 0 else 0.0

    return {
        "month": target_month,
        "year": target_year,
        "summary": {
            "total_budgeted": total_budgeted,
            "total_spent": total_spent_in_budgets,
            "total_remaining": max(0.0, total_budgeted - total_spent_in_budgets),
            "overall_percentage_used": overall_percentage,
            "is_overall_exceeded": total_spent_in_budgets > total_budgeted
        },
        "budgets": budget_list
    }, 200

def set_or_update_budget(user_id: str, category_id: str, amount: float, month: int = None, year: int = None):
    today = date.today()
    target_month = int(month) if month else today.month
    target_year = int(year) if year else today.year

    if not (1 <= target_month <= 12):
        return {"error": "Month must be between 1 and 12."}, 400
    if target_year < 2020:
        return {"error": "Invalid year specified."}, 400

    try:
        amount_num = float(amount)
        if amount_num <= 0:
            return {"error": "Budget amount must be greater than zero."}, 400
    except (ValueError, TypeError):
        return {"error": "Invalid budget amount."}, 400

    # Validate category exists and is an expense category
    category = db.session.get(Category, category_id)
    if not category or category.user_id != user_id:
        return {"error": "Invalid category selected for this user."}, 400
    if category.type != "expense":
        return {"error": "Budgets can only be set for expense categories."}, 400

    # Check if budget exists for this month/year -> Upsert
    budget = Budget.query.filter_by(
        user_id=user_id,
        category_id=category_id,
        month=target_month,
        year=target_year
    ).first()

    if budget:
        budget.amount = amount_num
    else:
        budget = Budget(
            user_id=user_id,
            category_id=category_id,
            amount=amount_num,
            month=target_month,
            year=target_year
        )
        db.session.add(budget)

    db.session.commit()
    return {"budget": budget.to_dict()}, 200

def delete_budget(user_id: str, budget_id: str):
    budget = db.session.get(Budget, budget_id)
    if not budget or budget.user_id != user_id:
        return {"error": "Budget not found."}, 404

    db.session.delete(budget)
    db.session.commit()
    return {"message": "Budget deleted successfully."}, 200
