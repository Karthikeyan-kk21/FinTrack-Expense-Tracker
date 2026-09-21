import os
from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, cors
from app.utils.error_handlers import register_error_handlers
from app.routes import (
    auth_bp,
    category_bp,
    transaction_bp,
    budget_bp,
    dashboard_bp,
    report_bp,
    savings_bp
)

def create_app(config_class=Config):
    flask_app = Flask(__name__)
    flask_app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    cors.init_app(
        flask_app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"]
    )

    # Register Global Error Handlers
    register_error_handlers(flask_app)

    # Register Blueprints
    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(category_bp)
    flask_app.register_blueprint(transaction_bp)
    flask_app.register_blueprint(budget_bp)
    flask_app.register_blueprint(dashboard_bp)
    flask_app.register_blueprint(report_bp)
    flask_app.register_blueprint(savings_bp)

    # Health check endpoint
    @flask_app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Expense & Finance Tracker API",
            "version": "1.0.0"
        }), 200

    # Create tables automatically for development/SQLite if they don't exist
    with flask_app.app_context():
        import app.models  # noqa
        db.create_all()

    return flask_app
