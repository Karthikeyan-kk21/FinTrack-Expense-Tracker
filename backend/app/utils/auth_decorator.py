import jwt
from datetime import datetime, timezone
from functools import wraps
from flask import request, current_app
from app.utils.error_handlers import error_response

def generate_token(user_id):
    """Generate a JWT token for a given user UUID string."""
    payload = {
        "sub": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
    }
    token = jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")
    return token

def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            current_app.config["JWT_SECRET_KEY"],
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return {"error": "TOKEN_EXPIRED", "message": "Authentication token has expired"}
    except jwt.InvalidTokenError:
        return {"error": "TOKEN_INVALID", "message": "Authentication token is invalid"}

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header: Bearer <token>
        auth_header = request.headers.get("Authorization")
        if auth_header:
            parts = auth_header.split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
        
        # Fallback to cookie if present
        if not token and "access_token" in request.cookies:
            token = request.cookies.get("access_token")

        if not token:
            return error_response("Authentication token is missing.", code="UNAUTHORIZED", status_code=401)

        payload = decode_token(token)
        if "error" in payload:
            return error_response(payload["message"], code=payload["error"], status_code=401)

        user_id = payload.get("sub")
        return f(current_user_id=user_id, *args, **kwargs)

    return decorated
