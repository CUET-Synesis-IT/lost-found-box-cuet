"""Supabase integration configuration shared by future auth and data layers.

This module intentionally does not authenticate requests yet. The next phase
will use these settings to implement a FastAPI current-user dependency.
"""

from dataclasses import dataclass

from app.core.config import Settings


@dataclass(frozen=True)
class SupabaseTokenValidationConfig:
    """Trusted inputs required to validate a Supabase access token."""

    issuer: str
    audience: str
    jwks_url: str | None
    jwt_secret: str | None


def get_supabase_token_validation_config(
    settings: Settings,
) -> SupabaseTokenValidationConfig:
    """Build validation settings without exposing secrets in logs or responses.

    JWKS is the preferred verification source for modern asymmetric Supabase
    signing keys. `jwt_secret` supports legacy HS256 projects only.
    """
    if not settings.supabase_jwt_issuer:
        raise RuntimeError("SUPABASE_URL must be configured before validating tokens.")

    jwks_url = settings.resolved_supabase_jwks_url
    jwt_secret = (
        settings.supabase_jwt_secret.get_secret_value()
        if settings.supabase_jwt_secret
        else None
    )
    if not jwks_url and not jwt_secret:
        raise RuntimeError(
            "Configure SUPABASE_JWKS_URL (or SUPABASE_URL for its default) "
            "or SUPABASE_JWT_SECRET before validating tokens."
        )

    return SupabaseTokenValidationConfig(
        issuer=settings.supabase_jwt_issuer,
        audience=settings.supabase_jwt_audience,
        jwks_url=jwks_url,
        jwt_secret=jwt_secret,
    )
