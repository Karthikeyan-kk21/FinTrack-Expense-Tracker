import re
from app.extensions import db
from app.models.user import User
from app.models.category import Category
from app.utils.constants import DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES
from app.utils.auth_decorator import generate_token

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

def seed_default_categories(user_id: str):
    """Seed default income and expense categories for a newly registered user."""
    categories_to_add = []
    
    for item in DEFAULT_EXPENSE_CATEGORIES:
        cat = Category(
            user_id=user_id,
            name=item["name"],
            type="expense",
            icon=item["icon"],
            color=item["color"],
            is_default=True
        )
        categories_to_add.append(cat)

    for item in DEFAULT_INCOME_CATEGORIES:
        cat = Category(
            user_id=user_id,
            name=item["name"],
            type="income",
            icon=item["icon"],
            color=item["color"],
            is_default=True
        )
        categories_to_add.append(cat)

    db.session.add_all(categories_to_add)

def register_user(name: str, email: str, password: str, currency: str = "INR"):
    name = (name or "").strip()
    email = (email or "").strip().lower()
    password = (password or "").strip()
    currency = (currency or "INR").strip().upper()

    # Validation
    if not name or len(name) < 2:
        return {"error": "Name must be at least 2 characters long."}, 400
    if not email or not re.match(EMAIL_REGEX, email):
        return {"error": "Invalid email address."}, 400
    if not password or len(password) < 6:
        return {"error": "Password must be at least 6 characters long."}, 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return {"error": "An account with this email already exists."}, 409

    user = User(
        name=name,
        email=email,
        currency=currency
    )
    user.set_password(password)

    db.session.add(user)
    db.session.flush()  # Assigns user.id before seeding

    # Seed default categories for this user
    seed_default_categories(user.id)
    db.session.commit()

    token = generate_token(user.id)
    return {
        "user": user.to_dict(),
        "token": token
    }, 201

def login_user(email: str, password: str):
    email = (email or "").strip().lower()
    password = (password or "").strip()

    if not email or not password:
        return {"error": "Email and password are required."}, 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "Invalid email or password."}, 401

    token = generate_token(user.id)
    return {
        "user": user.to_dict(),
        "token": token
    }, 200

def get_user_profile(user_id: str):
    user = db.session.get(User, user_id)
    if not user:
        return {"error": "User not found."}, 404
    return {"user": user.to_dict()}, 200

def update_user_profile(user_id: str, name: str = None, email: str = None, currency: str = None, new_password: str = None, current_password: str = None):
    user = db.session.get(User, user_id)
    if not user:
        return {"error": "User not found."}, 404

    if name:
        name = name.strip()
        if len(name) < 2:
            return {"error": "Name must be at least 2 characters long."}, 400
        user.name = name

    if email:
        email = email.strip().lower()
        if not re.match(EMAIL_REGEX, email):
            return {"error": "Invalid email address format."}, 400
        if email != user.email:
            existing = User.query.filter_by(email=email).first()
            if existing and existing.id != user.id:
                return {"error": "This email address is already in use by another account."}, 409
            user.email = email

    if currency:
        user.currency = currency.strip().upper()

    if new_password:
        if not current_password or not user.check_password(current_password):
            return {"error": "Current password is incorrect."}, 400
        if len(new_password) < 6:
            return {"error": "New password must be at least 6 characters long."}, 400
        user.set_password(new_password)

    db.session.commit()
    return {"user": user.to_dict()}, 200

def reset_password(email: str, new_password: str):
    email = (email or "").strip().lower()
    new_password = (new_password or "").strip()

    if not email or not re.match(EMAIL_REGEX, email):
        return {"error": "A valid registered email address is required."}, 400

    if not new_password or len(new_password) < 6:
        return {"error": "New password must be at least 6 characters long."}, 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return {"error": "No account found with this email address."}, 404

    user.set_password(new_password)
    db.session.commit()

    return {"message": "Password has been successfully updated."}, 200

