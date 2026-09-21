from flask import Blueprint, request
from app.services.transaction_service import (
    get_transactions,
    create_transaction,
    get_transaction_by_id,
    update_transaction,
    delete_transaction
)
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response, error_response

transaction_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

@transaction_bp.route("", methods=["GET"])
@token_required
def list_transactions(current_user_id):
    t_type = request.args.get("type")
    category_id = request.args.get("category_id")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    search = request.args.get("search")
    sort_by = request.args.get("sort_by", "transaction_date")
    sort_order = request.args.get("sort_order", "desc")
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    result, status_code = get_transactions(
        user_id=current_user_id,
        transaction_type=t_type,
        category_id=category_id,
        start_date=start_date,
        end_date=end_date,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

    return success_response(data=result, message="Transactions retrieved")

@transaction_bp.route("", methods=["POST"])
@token_required
def add_transaction(current_user_id):
    data = request.get_json() or {}
    category_id = data.get("category_id")
    t_type = data.get("type")
    amount = data.get("amount")
    title = data.get("title")
    description = data.get("description")
    transaction_date = data.get("transaction_date")

    result, status_code = create_transaction(
        user_id=current_user_id,
        category_id=category_id,
        transaction_type=t_type,
        amount=amount,
        title=title,
        description=description,
        transaction_date=transaction_date
    )

    if status_code != 201:
        return error_response(result.get("error", "Failed to create transaction"), code="TRANSACTION_ERROR", status_code=status_code)

    return success_response(data=result, message="Transaction created successfully", status_code=201)

@transaction_bp.route("/<transaction_id>", methods=["GET"])
@token_required
def get_transaction(current_user_id, transaction_id):
    result, status_code = get_transaction_by_id(current_user_id, transaction_id)
    if status_code != 200:
        return error_response(result.get("error", "Transaction not found"), code="NOT_FOUND", status_code=status_code)

    return success_response(data=result, message="Transaction retrieved")

@transaction_bp.route("/<transaction_id>", methods=["PUT"])
@token_required
def edit_transaction(current_user_id, transaction_id):
    data = request.get_json() or {}
    result, status_code = update_transaction(current_user_id, transaction_id, data)
    if status_code != 200:
        return error_response(result.get("error", "Failed to update transaction"), code="TRANSACTION_ERROR", status_code=status_code)

    return success_response(data=result, message="Transaction updated successfully")

@transaction_bp.route("/<transaction_id>", methods=["DELETE"])
@token_required
def remove_transaction(current_user_id, transaction_id):
    result, status_code = delete_transaction(current_user_id, transaction_id)
    if status_code != 200:
        return error_response(result.get("error", "Failed to delete transaction"), code="TRANSACTION_ERROR", status_code=status_code)

    return success_response(data=result, message="Transaction deleted successfully")
