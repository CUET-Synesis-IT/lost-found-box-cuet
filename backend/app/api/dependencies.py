"""Reusable FastAPI dependencies for authenticated API endpoints."""

from typing import Annotated

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import Settings, get_settings
from app.core.security import CurrentUser, decode_supabase_access_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Security(bearer_scheme)
    ],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    """Validate a Supabase bearer token and enforce the CUET email restriction."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return decode_supabase_access_token(credentials.credentials, settings)
