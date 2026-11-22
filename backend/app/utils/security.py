from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple
import bcrypt
import jwt
import threading
from app.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    secret = settings.JWT_SECRET_KEY
    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is not configured. Set it in .env before running.")
    return jwt.encode(to_encode, secret, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        secret = settings.JWT_SECRET_KEY
        if not secret:
            return None
        payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except Exception:
        return None


# ---------------------------------------------------------------------------
# In-memory login rate limiter
# Tracks failed attempts per email address (not IP, since we're behind a
# single-process dev server; replace with Redis in production).
# ---------------------------------------------------------------------------
_rate_lock = threading.Lock()
_failed_attempts: Dict[str, list] = {}   # email -> [datetime, ...]

def check_login_rate_limit(email: str) -> Tuple[bool, int]:
    """
    Returns (is_allowed, seconds_remaining).
    If is_allowed is False, the caller should reject the login with a generic error.
    """
    max_attempts = settings.LOGIN_MAX_ATTEMPTS
    lockout_secs = settings.LOGIN_LOCKOUT_MINUTES * 60
    now = datetime.now(timezone.utc)

    with _rate_lock:
        attempts = _failed_attempts.get(email, [])
        # Expire old attempts outside the lockout window
        window_start = now - timedelta(seconds=lockout_secs)
        attempts = [t for t in attempts if t > window_start]
        _failed_attempts[email] = attempts

        if len(attempts) >= max_attempts:
            # Still locked out — compute remaining seconds
            oldest_in_window = attempts[0]
            unlock_at = oldest_in_window + timedelta(seconds=lockout_secs)
            remaining = int((unlock_at - now).total_seconds())
            return False, max(remaining, 1)

    return True, 0

def record_failed_login(email: str) -> None:
    """Record a failed login attempt for rate-limiting purposes."""
    now = datetime.now(timezone.utc)
    with _rate_lock:
        if email not in _failed_attempts:
            _failed_attempts[email] = []
        _failed_attempts[email].append(now)

def clear_failed_logins(email: str) -> None:
    """Clear failed attempts after a successful login."""
    with _rate_lock:
        _failed_attempts.pop(email, None)
