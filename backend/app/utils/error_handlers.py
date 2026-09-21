from flask import jsonify

def success_response(data=None, message="Operation successful", status_code=200):
    response = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(response), status_code

def error_response(message="An error occurred", code="ERROR", details=None, status_code=400):
    response = {
        "success": False,
        "error": {
            "code": code,
            "message": message,
            "details": details if details is not None else {}
        }
    }
    return jsonify(response), status_code

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return error_response(str(e.description if hasattr(e, 'description') else 'Bad Request'), code="BAD_REQUEST", status_code=400)

    @app.errorhandler(401)
    def unauthorized(e):
        return error_response("Unauthorized access. Token is missing or invalid.", code="UNAUTHORIZED", status_code=401)

    @app.errorhandler(403)
    def forbidden(e):
        return error_response("Access forbidden.", code="FORBIDDEN", status_code=403)

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Resource not found.", code="NOT_FOUND", status_code=404)

    @app.errorhandler(422)
    def unprocessable_entity(e):
        return error_response("Unprocessable entity / validation error.", code="VALIDATION_ERROR", status_code=422)

    @app.errorhandler(500)
    def internal_server_error(e):
        return error_response("An unexpected internal server error occurred.", code="INTERNAL_SERVER_ERROR", status_code=500)
