from flask import Blueprint, request
from app.services.analytics_service import get_reports_analytics
from app.utils.auth_decorator import token_required
from app.utils.error_handlers import success_response

report_bp = Blueprint("reports", __name__, url_prefix="/api/reports")

@report_bp.route("/analytics", methods=["GET"])
@token_required
def analytics(current_user_id):
    year = request.args.get("year", type=int)
    result, status_code = get_reports_analytics(current_user_id, year=year)
    return success_response(data=result, message="Report analytics retrieved")
