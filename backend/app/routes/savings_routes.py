from flask import Blueprint, request
from app.services.savings_service import (
    get_savings_goals,
    create_savings_goal,
    update_savings_goal,
    delete_savings_goal,
    add_savings_deposit,
    get_savings_deposits
)
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response, error_response

savings_bp = Blueprint("savings", __name__, url_prefix="/api/savings")

@savings_bp.route("/goals", methods=["GET"])
@token_required
def list_goals(current_user_id):
    result, status_code = get_savings_goals(current_user_id)
    return success_response(data=result, message="Savings goals retrieved")

@savings_bp.route("/goals", methods=["POST"])
@token_required
def add_goal(current_user_id):
    data = request.get_json() or {}
    title = data.get("title")
    target_amount = data.get("target_amount")
    initial_amount = data.get("initial_amount", 0.0)
    target_date = data.get("target_date")
    color = data.get("color", "#10B981")
    icon = data.get("icon", "PiggyBank")

    result, status_code = create_savings_goal(
        user_id=current_user_id,
        title=title,
        target_amount=target_amount,
        initial_amount=initial_amount,
        target_date=target_date,
        color=color,
        icon=icon
    )
    if status_code != 201:
        return error_response(result.get("error", "Failed to create savings goal"), code="SAVINGS_ERROR", status_code=status_code)

    return success_response(data=result, message="Savings goal created successfully", status_code=201)

@savings_bp.route("/goals/<goal_id>", methods=["PUT"])
@token_required
def edit_goal(current_user_id, goal_id):
    data = request.get_json() or {}
    title = data.get("title")
    target_amount = data.get("target_amount")
    target_date = data.get("target_date")
    color = data.get("color")
    icon = data.get("icon")

    result, status_code = update_savings_goal(
        user_id=current_user_id,
        goal_id=goal_id,
        title=title,
        target_amount=target_amount,
        target_date=target_date,
        color=color,
        icon=icon
    )
    if status_code != 200:
        return error_response(result.get("error", "Failed to update savings goal"), code="SAVINGS_ERROR", status_code=status_code)

    return success_response(data=result, message="Savings goal updated successfully")

@savings_bp.route("/goals/<goal_id>", methods=["DELETE"])
@token_required
def remove_goal(current_user_id, goal_id):
    result, status_code = delete_savings_goal(current_user_id, goal_id)
    if status_code != 200:
        return error_response(result.get("error", "Failed to delete savings goal"), code="SAVINGS_ERROR", status_code=status_code)

    return success_response(data=result, message="Savings goal deleted successfully")

@savings_bp.route("/goals/<goal_id>/deposit", methods=["POST"])
@token_required
def record_deposit(current_user_id, goal_id):
    data = request.get_json() or {}
    amount = data.get("amount")
    note = data.get("note")
    deposit_date = data.get("deposit_date")

    result, status_code = add_savings_deposit(
        user_id=current_user_id,
        goal_id=goal_id,
        amount=amount,
        note=note,
        deposit_date=deposit_date
    )
    if status_code != 201:
        return error_response(result.get("error", "Failed to record deposit"), code="SAVINGS_ERROR", status_code=status_code)

    return success_response(data=result, message="Deposit recorded successfully", status_code=201)

@savings_bp.route("/goals/<goal_id>/deposits", methods=["GET"])
@token_required
def list_deposits(current_user_id, goal_id):
    result, status_code = get_savings_deposits(current_user_id, goal_id)
    if status_code != 200:
        return error_response(result.get("error", "Failed to fetch deposits"), code="SAVINGS_ERROR", status_code=status_code)

    return success_response(data=result, message="Deposits retrieved")
