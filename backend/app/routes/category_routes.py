from flask import Blueprint, request
from app.services.category_service import (
    get_categories,
    create_category,
    update_category,
    delete_category
)
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response, error_response

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

@category_bp.route("", methods=["GET"])
@token_required
def list_categories(current_user_id):
    cat_type = request.args.get("type")
    result, status_code = get_categories(current_user_id, category_type=cat_type)
    return success_response(data=result, message="Categories retrieved")

@category_bp.route("", methods=["POST"])
@token_required
def add_category(current_user_id):
    data = request.get_json() or {}
    name = data.get("name")
    cat_type = data.get("type")
    icon = data.get("icon", "Tag")
    color = data.get("color", "#6366F1")

    result, status_code = create_category(current_user_id, name, cat_type, icon, color)
    if status_code != 201:
        return error_response(result.get("error", "Failed to create category"), code="CATEGORY_ERROR", status_code=status_code)

    return success_response(data=result, message="Category created successfully", status_code=201)

@category_bp.route("/<category_id>", methods=["PUT"])
@token_required
def edit_category(current_user_id, category_id):
    data = request.get_json() or {}
    name = data.get("name")
    icon = data.get("icon")
    color = data.get("color")

    result, status_code = update_category(current_user_id, category_id, name=name, icon=icon, color=color)
    if status_code != 200:
        return error_response(result.get("error", "Failed to update category"), code="CATEGORY_ERROR", status_code=status_code)

    return success_response(data=result, message="Category updated successfully")

@category_bp.route("/<category_id>", methods=["DELETE"])
@token_required
def remove_category(current_user_id, category_id):
    result, status_code = delete_category(current_user_id, category_id)
    if status_code != 200:
        return error_response(result.get("error", "Failed to delete category"), code="CATEGORY_DELETE_ERROR", status_code=status_code)

    return success_response(data=result, message=result.get("message", "Category deleted"))
