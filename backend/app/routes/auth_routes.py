from flask import Blueprint, request
from app.services.auth_service import register_user, login_user, get_user_profile, update_user_profile, reset_password
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response, error_response

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    currency = data.get("currency", "INR")

    result, status_code = register_user(name, email, password, currency)
    if status_code != 201:
        return error_response(result.get("error", "Registration failed"), code="REGISTRATION_ERROR", status_code=status_code)

    return success_response(data=result, message="Registration successful", status_code=201)

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    result, status_code = login_user(email, password)
    if status_code != 200:
        return error_response(result.get("error", "Login failed"), code="AUTH_ERROR", status_code=status_code)

    return success_response(data=result, message="Login successful", status_code=200)

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user_id):
    result, status_code = get_user_profile(current_user_id)
    if status_code != 200:
        return error_response(result.get("error", "User not found"), code="NOT_FOUND", status_code=status_code)

    return success_response(data=result, message="User profile retrieved")

@auth_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user_id):
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    currency = data.get("currency")
    new_password = data.get("new_password")
    current_password = data.get("current_password")

    result, status_code = update_user_profile(
        current_user_id,
        name=name,
        email=email,
        currency=currency,
        new_password=new_password,
        current_password=current_password
    )
    if status_code != 200:
        return error_response(result.get("error", "Update profile failed"), code="UPDATE_ERROR", status_code=status_code)

    return success_response(data=result, message="Profile updated successfully")

@auth_bp.route("/reset-password", methods=["POST"])
@auth_bp.route("/forgot-password", methods=["POST"])
def reset_user_password():
    data = request.get_json() or {}
    email = data.get("email")
    new_password = data.get("new_password")

    result, status_code = reset_password(email, new_password)
    if status_code != 200:
        return error_response(result.get("error", "Password reset failed"), code="RESET_ERROR", status_code=status_code)

    return success_response(data=result, message=result.get("message", "Password reset successfully"))

