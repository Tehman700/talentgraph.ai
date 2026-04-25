from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from .database import get_db

_bearer = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Client = Depends(get_db),
) -> dict:
    token = credentials.credentials
    try:
        result = db.auth.get_user(token)
        return result.user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_optional),
    db: Client = Depends(get_db),
) -> dict | None:
    """Returns the authenticated user, or None if no valid token is provided."""
    if not credentials:
        return None
    try:
        result = db.auth.get_user(credentials.credentials)
        return result.user
    except Exception:
        return None
