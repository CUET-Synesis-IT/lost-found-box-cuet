"""Supabase access-token verification and CUET community authorization."""

from datetime import UTC, datetime
from functools import lru_cache

import jwt
from fastapi import HTTPException, status
from jwt import InvalidTokenError, PyJWKClient
from pydantic import BaseModel

from app.core.config import Settings
from app.core.supabase import get_supabase_token_validation_config

CUET_EMAIL_SUFFIXES = ("@student.cuet.ac.bd", "@cuet.ac.bd")
ASYMMETRIC_ALGORITHMS = ("RS256", "RS384", "RS512", "ES256", "ES384", "ES512")


class CurrentUser(BaseModel):
    """Verified user identity available to protected route handlers."""

    id: str
    email: str
    authenticated_at: datetime | None = None


def is_cuet_email(email: str | None) -> bool:
    """Return whether an email belongs to one of CUET's accepted domains."""
    if not email:
        return False
    return email.strip().lower().endswith(CUET_EMAIL_SUFFIXES)


@lru_cache
def get_jwk_client(jwks_url: str) -> PyJWKClient:
    """Cache remote signing keys instead of fetching them for every request."""
    return PyJWKClient(jwks_url, cache_keys=True)


def _authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired access token.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_supabase_access_token(token: str, settings: Settings) -> CurrentUser:
    """Verify a Supabase JWT before deriving a trusted application identity."""
    config = get_supabase_token_validation_config(settings)

    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if algorithm == "HS256":
            if not config.jwt_secret:
                raise InvalidTokenError("No HS256 verification secret is configured.")
            signing_key = config.jwt_secret
            algorithms = ["HS256"]
        else:
            if algorithm not in ASYMMETRIC_ALGORITHMS or not config.jwks_url:
                raise InvalidTokenError("Unsupported token signing algorithm.")
            signing_key = get_jwk_client(config.jwks_url).get_signing_key_from_jwt(token).key
            algorithms = [algorithm]

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=algorithms,
            audience=config.audience,
            issuer=config.issuer,
            options={"require": ["exp", "sub", "email"]},
        )
    except (InvalidTokenError, ValueError, KeyError):
        raise _authentication_error() from None

    email = payload.get("email")
    if not isinstance(email, str) or not is_cuet_email(email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="A CUET institutional email address is required.",
        )

    authenticated_at = payload.get("authenticated_at")
    parsed_authenticated_at: datetime | None = None
    if isinstance(authenticated_at, int | float):
        parsed_authenticated_at = datetime.fromtimestamp(authenticated_at, tz=UTC)

    return CurrentUser(
        id=str(payload["sub"]),
        email=email.strip().lower(),
        authenticated_at=parsed_authenticated_at,
    )
