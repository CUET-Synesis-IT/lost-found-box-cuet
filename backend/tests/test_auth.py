from datetime import UTC, datetime, timedelta

import jwt
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import app

TEST_SUPABASE_URL = "https://example.supabase.co"
TEST_JWT_SECRET = "test-jwt-secret-not-for-production"


def test_settings() -> Settings:
    return Settings(
        supabase_url=TEST_SUPABASE_URL,
        supabase_jwt_secret=TEST_JWT_SECRET,
        supabase_jwt_audience="authenticated",
    )


def make_token(email: str) -> str:
    now = datetime.now(UTC)
    return jwt.encode(
        {
            "sub": "f0ef4dac-5c84-4e52-a98f-75d58ac2347d",
            "email": email,
            "aud": "authenticated",
            "iss": f"{TEST_SUPABASE_URL}/auth/v1",
            "iat": now,
            "exp": now + timedelta(minutes=5),
        },
        TEST_JWT_SECRET,
        algorithm="HS256",
    )


def setup_function() -> None:
    app.dependency_overrides[get_settings] = test_settings


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_authenticated_cuet_user_can_access_me() -> None:
    client = TestClient(app)
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {make_token('u2104087@student.cuet.ac.bd')}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "u2104087@student.cuet.ac.bd"


def test_non_cuet_user_is_denied_even_with_valid_token() -> None:
    client = TestClient(app)
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {make_token('person@example.com')}"},
    )

    assert response.status_code == 403


def test_missing_token_is_unauthorized() -> None:
    client = TestClient(app)

    assert client.get("/api/v1/auth/me").status_code == 401
