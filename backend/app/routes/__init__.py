from app.routes.auth_routes import auth_bp
from app.routes.category_routes import category_bp
from app.routes.transaction_routes import transaction_bp
from app.routes.budget_routes import budget_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.report_routes import report_bp
from app.routes.savings_routes import savings_bp

__all__ = [
    "auth_bp",
    "category_bp",
    "transaction_bp",
    "budget_bp",
    "dashboard_bp",
    "report_bp",
    "savings_bp"
]
