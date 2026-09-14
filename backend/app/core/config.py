from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime settings loaded from the backend environment file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CUET Lost and Found Box API"
    app_env: str = "development"
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Supabase integration. Values remain optional until the Supabase project
    # is provisioned so the Phase 1 health endpoint can still run locally.
    supabase_url: str | None = None
    supabase_jwt_secret: SecretStr | None = None
    supabase_jwks_url: str | None = None
    supabase_jwt_audience: str = "authenticated"
    database_url: SecretStr | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def supabase_jwt_issuer(self) -> str | None:
        """Expected `iss` claim for Supabase access tokens, when configured."""
        if not self.supabase_url:
            return None
        return f"{self.supabase_url.rstrip('/')}/auth/v1"

    @property
    def resolved_supabase_jwks_url(self) -> str | None:
        """JWKS endpoint used by asymmetric Supabase signing-key projects."""
        if self.supabase_jwks_url:
            return self.supabase_jwks_url
        if not self.supabase_url:
            return None
        return f"{self.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"

    @property
    def has_supabase_token_validation_config(self) -> bool:
        """Whether either supported JWT verification source is configured."""
        return bool(self.resolved_supabase_jwks_url or self.supabase_jwt_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
