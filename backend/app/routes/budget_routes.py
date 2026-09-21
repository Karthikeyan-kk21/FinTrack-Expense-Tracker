from flask import Blueprint, request
from app.services.budget_service import (
    get_budgets,
    set_or_update_budget,
    delete_budget
)
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response, error_response

budget_bp = Blueprint("budgets", __name__, url_prefix="/api/budgets")

@budget_bp.route("", methods=["GET"])
@token_required
def list_budgets(current_user_id):
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    result, status_code = get_budgets(current_user_id, month=month, year=year)
    return success_response(data=result, message="Budgets retrieved")

@budget_bp.route("", methods=["POST"])
@token_required
def save_budget(current_user_id):
    data = request.get_json() or {}
    category_id = data.get("category_id")
    amount = data.get("amount")
    month = data.get("month")
    year = data.get("year")

    result, status_code = set_or_update_budget(
        user_id=current_user_id,
        category_id=category_id,
        amount=amount,
        month=month,
        year=year
    )

    if status_code != 200:
        return error_response(result.get("error", "Failed to save budget"), code="BUDGET_ERROR", status_code=status_code)

    return success_response(data=result, message="Budget saved successfully", status_code=200)

@budget_bp.route("/<budget_id>", methods=["DELETE"])
@token_required
def remove_budget(current_user_id, budget_id):
    result, status_code = delete_budget(current_user_id, budget_id)
    if status_code != 200:
        return error_response(result.get("error", "Failed to delete budget"), code="BUDGET_ERROR", status_code=status_code)

    return success_response(data=result, message="Budget deleted successfully")
