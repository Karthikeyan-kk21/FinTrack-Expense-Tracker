from datetime import datetime, date
from sqlalchemy import or_, desc, asc
from app.extensions import db
from app.models.transaction import Transaction
from app.models.category import Category

def get_transactions(
    user_id: str,
    transaction_type: str = None,
    category_id: str = None,
    start_date: str = None,
    end_date: str = None,
    search: str = None,
    sort_by: str = "transaction_date",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 10
):
    query = Transaction.query.filter_by(user_id=user_id)

    # Filter by transaction type
    if transaction_type and transaction_type.lower() in ["income", "expense"]:
        query = query.filter_by(type=transaction_type.lower())

    # Filter by category
    if category_id:
        query = query.filter_by(category_id=category_id)

    # Filter by date range
    if start_date:
        try:
            start_d = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date >= start_d)
        except ValueError:
            pass

    if end_date:
        try:
            end_d = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(Transaction.transaction_date <= end_d)
        except ValueError:
            pass

    # Search by title or description
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.title.ilike(search_pattern),
                Transaction.description.ilike(search_pattern)
            )
        )

    # Sorting
    sort_column = Transaction.transaction_date
    if sort_by == "amount":
        sort_column = Transaction.amount
    elif sort_by == "title":
        sort_column = Transaction.title
    elif sort_by == "created_at":
        sort_column = Transaction.created_at

    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column), asc(Transaction.created_at))
    else:
        query = query.order_by(desc(sort_column), desc(Transaction.created_at))

    # Pagination
    page = max(1, page)
    limit = max(1, min(100, limit))
    total_count = query.count()
    total_pages = max(1, (total_count + limit - 1) // limit)

    transactions = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "transactions": [t.to_dict() for t in transactions],
        "pagination": {
            "page": page,
            "limit": limit,
            "total_count": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }, 200

def create_transaction(
    user_id: str,
    category_id: str,
    transaction_type: str,
    amount: float,
    title: str,
    description: str = None,
    transaction_date: str = None
):
    title = (title or "").strip()
    transaction_type = (transaction_type or "").strip().lower()
    description = (description or "").strip() if description else None

    if not title:
        return {"error": "Transaction title is required."}, 400

    if transaction_type not in ["income", "expense"]:
        return {"error": "Transaction type must be 'income' or 'expense'."}, 400

    try:
        amount_num = float(amount)
        if amount_num <= 0:
            return {"error": "Amount must be greater than zero."}, 400
    except (ValueError, TypeError):
        return {"error": "Invalid amount specified."}, 400

    # Validate category belongs to user
    category = db.session.get(Category, category_id)
    if not category or category.user_id != user_id:
        return {"error": "Invalid category selected for this user."}, 400

    if category.type != transaction_type:
        return {"error": f"Category '{category.name}' is for '{category.type}', not '{transaction_type}'."}, 400

    # Parse date
    if transaction_date:
        try:
            t_date = datetime.strptime(transaction_date, "%Y-%m-%d").date()
        except ValueError:
            return {"error": "Invalid date format. Expected YYYY-MM-DD."}, 400
    else:
        t_date = date.today()

    transaction = Transaction(
        user_id=user_id,
        category_id=category_id,
        type=transaction_type,
        amount=amount_num,
        title=title,
        description=description,
        transaction_date=t_date
    )

    db.session.add(transaction)
    db.session.commit()

    return {"transaction": transaction.to_dict()}, 201

def get_transaction_by_id(user_id: str, transaction_id: str):
    transaction = db.session.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        return {"error": "Transaction not found."}, 404
    return {"transaction": transaction.to_dict()}, 200

def update_transaction(user_id: str, transaction_id: str, data: dict):
    transaction = db.session.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        return {"error": "Transaction not found."}, 404

    if "title" in data:
        title = data["title"].strip()
        if not title:
            return {"error": "Title cannot be empty."}, 400
        transaction.title = title

    if "amount" in data:
        try:
            amount_num = float(data["amount"])
            if amount_num <= 0:
                return {"error": "Amount must be greater than zero."}, 400
            transaction.amount = amount_num
        except (ValueError, TypeError):
            return {"error": "Invalid amount specified."}, 400

    if "type" in data:
        t_type = data["type"].strip().lower()
        if t_type not in ["income", "expense"]:
            return {"error": "Type must be 'income' or 'expense'."}, 400
        transaction.type = t_type

    if "category_id" in data:
        category = db.session.get(Category, data["category_id"])
        if not category or category.user_id != user_id:
            return {"error": "Invalid category selected for this user."}, 400
        if category.type != transaction.type:
            return {"error": f"Category '{category.name}' does not match transaction type '{transaction.type}'."}, 400
        transaction.category_id = data["category_id"]

    if "description" in data:
        transaction.description = data["description"].strip() if data["description"] else None

    if "transaction_date" in data:
        try:
            t_date = datetime.strptime(data["transaction_date"], "%Y-%m-%d").date()
            transaction.transaction_date = t_date
        except ValueError:
            return {"error": "Invalid date format. Expected YYYY-MM-DD."}, 400

    db.session.commit()
    return {"transaction": transaction.to_dict()}, 200

def delete_transaction(user_id: str, transaction_id: str):
    transaction = db.session.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        return {"error": "Transaction not found."}, 404

    db.session.delete(transaction)
    db.session.commit()
    return {"message": "Transaction deleted successfully."}, 200
