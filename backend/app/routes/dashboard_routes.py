from flask import Blueprint, request
from app.services.analytics_service import (
    get_dashboard_summary,
    get_monthly_trends,
    get_category_breakdown
)
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/summary", methods=["GET"])
@token_required
def summary(current_user_id):
    result, status_code = get_dashboard_summary(current_user_id)
    return success_response(data=result, message="Dashboard summary retrieved")

@dashboard_bp.route("/monthly-trends", methods=["GET"])
@token_required
def monthly_trends(current_user_id):
    months = request.args.get("months", 6, type=int)
    result, status_code = get_monthly_trends(current_user_id, months=months)
    return success_response(data=result, message="Monthly trends retrieved")

@dashboard_bp.route("/category-breakdown", methods=["GET"])
@token_required
def category_breakdown(current_user_id):
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)
    c_type = request.args.get("type", "expense")

    result, status_code = get_category_breakdown(current_user_id, month=month, year=year, category_type=c_type)
    return success_response(data=result, message="Category breakdown retrieved")
