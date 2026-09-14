from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.core.security import CurrentUser

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.get("/me")
async def get_authenticated_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Authenticated test endpoint for validating the Supabase access token flow."""
    return current_user
