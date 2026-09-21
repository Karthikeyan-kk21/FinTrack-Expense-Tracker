from app.extensions import db
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget

def get_categories(user_id: str, category_type: str = None):
    query = Category.query.filter_by(user_id=user_id)
    if category_type and category_type in ["income", "expense"]:
        query = query.filter_by(type=category_type)
    
    categories = query.order_by(Category.is_default.desc(), Category.name.asc()).all()
    return [c.to_dict() for c in categories], 200

def create_category(user_id: str, name: str, category_type: str, icon: str = "Tag", color: str = "#6366F1"):
    name = (name or "").strip()
    category_type = (category_type or "").strip().lower()
    icon = (icon or "Tag").strip()
    color = (color or "#6366F1").strip()

    if not name:
        return {"error": "Category name is required."}, 400
    if category_type not in ["income", "expense"]:
        return {"error": "Category type must be either 'income' or 'expense'."}, 400

    # Check for duplicate
    existing = Category.query.filter_by(user_id=user_id, name=name, type=category_type).first()
    if existing:
        return {"error": f"A {category_type} category named '{name}' already exists."}, 409

    category = Category(
        user_id=user_id,
        name=name,
        type=category_type,
        icon=icon,
        color=color,
        is_default=False
    )
    db.session.add(category)
    db.session.commit()

    return {"category": category.to_dict()}, 201

def update_category(user_id: str, category_id: str, name: str = None, icon: str = None, color: str = None):
    category = db.session.get(Category, category_id)
    if not category or category.user_id != user_id:
        return {"error": "Category not found."}, 404

    if name:
        name = name.strip()
        # Check duplicate if name is changing
        if name != category.name:
            existing = Category.query.filter_by(user_id=user_id, name=name, type=category.type).first()
            if existing:
                return {"error": f"A {category.type} category named '{name}' already exists."}, 409
            category.name = name

    if icon:
        category.icon = icon.strip()
    if color:
        category.color = color.strip()

    db.session.commit()
    return {"category": category.to_dict()}, 200

def delete_category(user_id: str, category_id: str):
    category = db.session.get(Category, category_id)
    if not category or category.user_id != user_id:
        return {"error": "Category not found."}, 404

    # Check if category is used in transactions
    transaction_count = Transaction.query.filter_by(user_id=user_id, category_id=category_id).count()
    if transaction_count > 0:
        return {
            "error": f"Cannot delete category '{category.name}' because it is linked to {transaction_count} transaction(s). Please reassign or delete the transactions first."
        }, 400

    # Delete any budgets attached to this category
    Budget.query.filter_by(user_id=user_id, category_id=category_id).delete()

    db.session.delete(category)
    db.session.commit()
    return {"message": f"Category '{category.name}' deleted successfully."}, 200
