from datetime import date, datetime
from dateutil.relativedelta import relativedelta
from sqlalchemy import func, extract
from app.extensions import db
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.savings import SavingsGoal, SavingsDeposit

def get_dashboard_summary(user_id: str):
    today = date.today()
    current_month = today.month
    current_year = today.year

    # 1. Lifetime Totals
    lifetime_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income"
    ).scalar()

    lifetime_expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense"
    ).scalar()

    lifetime_balance = float(lifetime_income) - float(lifetime_expense)

    # 2. Current Month Totals
    curr_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income",
        extract("month", Transaction.transaction_date) == current_month,
        extract("year", Transaction.transaction_date) == current_year
    ).scalar()

    curr_expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        extract("month", Transaction.transaction_date) == current_month,
        extract("year", Transaction.transaction_date) == current_year
    ).scalar()

    curr_income_f = float(curr_income)
    curr_expense_f = float(curr_expense)
    curr_savings = curr_income_f - curr_expense_f
    savings_rate = round((curr_savings / curr_income_f * 100.0), 1) if curr_income_f > 0 else 0.0

    # 3. Previous Month for trend comparisons
    first_of_month = date(current_year, current_month, 1)
    prev_month_date = first_of_month - relativedelta(months=1)
    prev_month = prev_month_date.month
    prev_year = prev_month_date.year

    prev_income = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income",
        extract("month", Transaction.transaction_date) == prev_month,
        extract("year", Transaction.transaction_date) == prev_year
    ).scalar()

    prev_expense = db.session.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        extract("month", Transaction.transaction_date) == prev_month,
        extract("year", Transaction.transaction_date) == prev_year
    ).scalar()

    prev_income_f = float(prev_income)
    prev_expense_f = float(prev_expense)

    # Calculate percentage changes
    income_change_pct = round(((curr_income_f - prev_income_f) / prev_income_f * 100.0), 1) if prev_income_f > 0 else 0.0
    expense_change_pct = round(((curr_expense_f - prev_expense_f) / prev_expense_f * 100.0), 1) if prev_expense_f > 0 else 0.0

    # 4. Recent Transactions (last 5)
    recent = Transaction.query.filter_by(user_id=user_id).order_by(
        Transaction.transaction_date.desc(),
        Transaction.created_at.desc()
    ).limit(5).all()

    # 5. Budget Overview
    total_budget_limit = db.session.query(func.coalesce(func.sum(Budget.amount), 0)).filter(
        Budget.user_id == user_id,
        Budget.month == current_month,
        Budget.year == current_year
    ).scalar()

    # 6. Savings Goals Overview
    savings_goals = SavingsGoal.query.filter_by(user_id=user_id).all()
    total_saved = sum(float(g.current_amount) for g in savings_goals)
    total_target = sum(float(g.target_amount) for g in savings_goals)

    return {
        "lifetime": {
            "total_balance": lifetime_balance,
            "total_income": float(lifetime_income),
            "total_expense": float(lifetime_expense)
        },
        "current_month": {
            "month": current_month,
            "year": current_year,
            "income": curr_income_f,
            "expense": curr_expense_f,
            "net_cashflow": curr_savings,
            "savings_rate": savings_rate,
            "income_change_pct": income_change_pct,
            "expense_change_pct": expense_change_pct
        },
        "budget_summary": {
            "total_budgeted": float(total_budget_limit),
            "total_spent": curr_expense_f
        },
        "savings_summary": {
            "total_saved": total_saved,
            "total_target": total_target,
            "active_goals_count": len(savings_goals),
            "goals": [g.to_dict() for g in savings_goals[:4]]
        },
        "recent_transactions": [t.to_dict() for t in recent]
    }, 200

def get_monthly_trends(user_id: str, months: int = 6):
    months = max(3, min(24, int(months)))
    today = date.today()
    
    # Generate list of (year, month) for the last N months
    periods = []
    curr = date(today.year, today.month, 1)
    for i in range(months - 1, -1, -1):
        target_d = curr - relativedelta(months=i)
        periods.append((target_d.year, target_d.month, target_d.strftime("%b %Y")))

    # Query all transactions for user within this span
    earliest_date = curr - relativedelta(months=months - 1)
    
    records = db.session.query(
        extract("year", Transaction.transaction_date).label("year"),
        extract("month", Transaction.transaction_date).label("month"),
        Transaction.type,
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_date >= earliest_date
    ).group_by(
        extract("year", Transaction.transaction_date),
        extract("month", Transaction.transaction_date),
        Transaction.type
    ).all()

    # Map records to dict key (year, month, type) -> total
    data_map = {}
    for r in records:
        key = (int(r.year), int(r.month), r.type)
        data_map[key] = float(r.total)

    trends = []
    for yr, mo, label in periods:
        inc = data_map.get((yr, mo, "income"), 0.0)
        exp = data_map.get((yr, mo, "expense"), 0.0)
        trends.append({
            "label": label,
            "month": mo,
            "year": yr,
            "income": inc,
            "expense": exp,
            "savings": inc - exp,
            "savings_rate": round(((inc - exp) / inc * 100.0), 1) if inc > 0 else 0.0
        })

    return {"trends": trends}, 200

def get_category_breakdown(user_id: str, month: int = None, year: int = None, category_type: str = "expense"):
    today = date.today()
    target_month = int(month) if month else today.month
    target_year = int(year) if year else today.year
    c_type = (category_type or "expense").lower()

    # Query sum grouped by category
    results = db.session.query(
        Category.id,
        Category.name,
        Category.icon,
        Category.color,
        func.coalesce(func.sum(Transaction.amount), 0).label("total_amount")
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == c_type,
        extract("month", Transaction.transaction_date) == target_month,
        extract("year", Transaction.transaction_date) == target_year
    ).group_by(
        Category.id, Category.name, Category.icon, Category.color
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).all()

    total_sum = sum(float(r.total_amount) for r in results)

    breakdown = []
    for r in results:
        amount = float(r.total_amount)
        pct = round((amount / total_sum * 100.0), 1) if total_sum > 0 else 0.0
        breakdown.append({
            "category_id": r.id,
            "category_name": r.name,
            "icon": r.icon,
            "color": r.color,
            "amount": amount,
            "percentage": pct
        })

    return {
        "month": target_month,
        "year": target_year,
        "type": c_type,
        "total_amount": total_sum,
        "categories": breakdown
    }, 200

def get_reports_analytics(user_id: str, year: int = None):
    today = date.today()
    target_year = int(year) if year else today.year

    # 1. Monthly cash flow for entire year (1 to 12)
    records = db.session.query(
        extract("month", Transaction.transaction_date).label("month"),
        Transaction.type,
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).filter(
        Transaction.user_id == user_id,
        extract("year", Transaction.transaction_date) == target_year
    ).group_by(
        extract("month", Transaction.transaction_date),
        Transaction.type
    ).all()

    data_map = {}
    for r in records:
        key = (int(r.month), r.type)
        data_map[key] = float(r.total)

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data = []
    total_year_income = 0.0
    total_year_expense = 0.0

    for mo in range(1, 13):
        inc = data_map.get((mo, "income"), 0.0)
        exp = data_map.get((mo, "expense"), 0.0)
        total_year_income += inc
        total_year_expense += exp
        monthly_data.append({
            "month_num": mo,
            "month_name": month_names[mo - 1],
            "income": inc,
            "expense": exp,
            "net": inc - exp
        })

    # 2. Category distribution for the entire year
    cat_records = db.session.query(
        Category.id,
        Category.name,
        Category.color,
        Category.icon,
        func.coalesce(func.sum(Transaction.amount), 0).label("total")
    ).join(
        Transaction, Transaction.category_id == Category.id
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense",
        extract("year", Transaction.transaction_date) == target_year
    ).group_by(
        Category.id, Category.name, Category.color, Category.icon
    ).order_by(
        func.sum(Transaction.amount).desc()
    ).all()

    categories_distribution = []
    for c in cat_records:
        amt = float(c.total)
        pct = round((amt / total_year_expense * 100.0), 1) if total_year_expense > 0 else 0.0
        categories_distribution.append({
            "category_id": c.id,
            "category_name": c.name,
            "color": c.color,
            "icon": c.icon,
            "amount": amt,
            "percentage": pct
        })

    net_savings = total_year_income - total_year_expense
    savings_rate = round((net_savings / total_year_income * 100.0), 1) if total_year_income > 0 else 0.0

    return {
        "year": target_year,
        "summary": {
            "total_income": total_year_income,
            "total_expense": total_year_expense,
            "net_savings": net_savings,
            "savings_rate": savings_rate,
            "average_monthly_expense": round(total_year_expense / 12.0, 2),
            "average_monthly_income": round(total_year_income / 12.0, 2)
        },
        "monthly_cashflow": monthly_data,
        "category_distribution": categories_distribution
    }, 200
