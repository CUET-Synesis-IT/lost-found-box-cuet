from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


def normalize_database_url(database_url: str) -> str:
    """Use pg8000 for standard Supabase PostgreSQL connection URLs.

    Supabase commonly supplies `postgresql://...`; SQLAlchemy otherwise maps
    that scheme to psycopg2. pg8000 is a pure-Python driver and avoids relying
    on platform `libpq` or native driver DLLs in local Windows development.
    """
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+pg8000://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+pg8000://", 1)
    return database_url


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL must be configured before using the posts API.")
    database_url = normalize_database_url(settings.database_url.get_secret_value())
    return sessionmaker(bind=create_engine(database_url, pool_pre_ping=True), autoflush=False, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    """Provide one transactional SQLAlchemy session per request."""
    try:
        session = get_session_factory()()
        # Force the connection here so driver, credential, and network errors
        # become a useful API response instead of an uncaught route failure.
        session.connection()
    except (RuntimeError, SQLAlchemyError, ModuleNotFoundError) as error:
        if "password authentication failed" in str(error).lower():
            detail = "Database connection was rejected. Check DATABASE_URL credentials."
        else:
            detail = "Database is temporarily unavailable. Check DATABASE_URL and the PostgreSQL driver."
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail) from error
    try:
        yield session
    finally:
        session.close()
