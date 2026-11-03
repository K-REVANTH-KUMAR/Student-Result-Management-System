import os
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import request, jsonify, g
from dotenv import load_dotenv
from database import get_db_connection

load_dotenv()


def generate_token(user_id):
    expiry_hours = int(os.getenv("JWT_EXPIRY_HOURS", "2"))
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=expiry_hours)
    }
    return jwt.encode(payload, os.getenv("SECRET_KEY"), algorithm="HS256")


def token_required(function):
    @wraps(function)
    def wrapper(*args, **kwargs):
        authorization = request.headers.get("Authorization", "")
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"message": "A valid Bearer token is required"}), 401

        try:
            payload = jwt.decode(parts[1], os.getenv("SECRET_KEY"), algorithms=["HS256"])
            connection = get_db_connection()
            user = connection.execute(
                "SELECT id, name, login_id, role FROM users WHERE id = ?",
                (payload["user_id"],)
            ).fetchone()
            connection.close()
            if user is None:
                return jsonify({"message": "User not found"}), 401
            g.user = dict(user)
        except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
            return jsonify({"message": "Invalid or expired token"}), 401

        return function(*args, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            if g.user["role"] not in allowed_roles:
                return jsonify({"message": "You do not have permission"}), 403
            return function(*args, **kwargs)
        return wrapper
    return decorator
