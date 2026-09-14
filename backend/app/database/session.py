from collections.abc import Generator
from functools import lru_cache

from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings


@lru_cache
def get_session_factory() -> sessionmaker[Session]:
    settings = get_settings()
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL must be configured before using the posts API.")
    database_url = settings.database_url.get_secret_value()
    return sessionmaker(bind=create_engine(database_url, pool_pre_ping=True), autoflush=False, expire_on_commit=False)


def get_db_session() -> Generator[Session, None, None]:
    """Provide one transactional SQLAlchemy session per request."""
    try:
        session = get_session_factory()()
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    try:
        yield session
    finally:
        session.close()
