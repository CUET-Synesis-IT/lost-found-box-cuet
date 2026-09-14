from datetime import UTC, datetime
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.dependencies import get_current_user
from app.core.security import CurrentUser
from app.database.models import Base, Profile
from app.database.session import get_db_session
from app.database.session import normalize_database_url
from app.main import app

OWNER_ID = uuid4()
OTHER_ID = uuid4()
engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def owner() -> CurrentUser:
    return CurrentUser(id=str(OWNER_ID), email="owner@student.cuet.ac.bd")


def other_user() -> CurrentUser:
    return CurrentUser(id=str(OTHER_ID), email="other@cuet.ac.bd")


def override_session():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def setup_function() -> None:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([
            Profile(id=OWNER_ID, email="owner@student.cuet.ac.bd"),
            Profile(id=OTHER_ID, email="other@cuet.ac.bd"),
        ])
        session.commit()
    app.dependency_overrides[get_db_session] = override_session
    app.dependency_overrides[get_current_user] = owner


def teardown_function() -> None:
    app.dependency_overrides.clear()


def payload(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "post_type": "LOST",
        "category": "Wallet",
        "description": "Black wallet with CUET ID",
        "location": "Central Library",
        "event_time": datetime.now(UTC).isoformat(),
    }
    data.update(overrides)
    return data


def create_post(client: TestClient, **overrides: object) -> dict[str, object]:
    response = client.post("/api/v1/posts", json=payload(**overrides))
    assert response.status_code == 201
    return response.json()


def test_unauthorized_creation_is_rejected() -> None:
    app.dependency_overrides.pop(get_current_user)
    client = TestClient(app)

    assert client.post("/api/v1/posts", json=payload()).status_code == 401


def test_authorized_creation_assigns_current_user() -> None:
    response = TestClient(app).post("/api/v1/posts", json=payload())

    assert response.status_code == 201
    assert response.json()["user_id"] == str(OWNER_ID)
    assert response.json()["status"] == "ACTIVE"


def test_unauthorized_update_by_another_user_is_rejected() -> None:
    client = TestClient(app)
    post = create_post(client)
    app.dependency_overrides[get_current_user] = other_user

    response = client.put(f"/api/v1/posts/{post['id']}", json={"location": "Hall"})

    assert response.status_code == 403


def test_owner_can_update_post() -> None:
    client = TestClient(app)
    post = create_post(client)

    response = client.put(f"/api/v1/posts/{post['id']}", json={"location": "Shahid Minar"})

    assert response.status_code == 200
    assert response.json()["location"] == "Shahid Minar"


def test_unauthorized_delete_by_another_user_is_rejected() -> None:
    client = TestClient(app)
    post = create_post(client)
    app.dependency_overrides[get_current_user] = other_user

    assert client.delete(f"/api/v1/posts/{post['id']}").status_code == 403


def test_owner_can_delete_post() -> None:
    client = TestClient(app)
    post = create_post(client)

    assert client.delete(f"/api/v1/posts/{post['id']}").status_code == 204
    assert client.get(f"/api/v1/posts/{post['id']}").status_code == 404


def test_filtering_search_and_pagination() -> None:
    client = TestClient(app)
    create_post(client, description="Black leather wallet", location="Central Library")
    create_post(client, post_type="FOUND", category="Keys", description="Blue keys", location="Hall")
    create_post(client, description="Red wallet", location="Cafeteria")

    response = client.get("/api/v1/posts", params={"post_type": "LOST", "category": "Wallet", "search": "wallet", "page": 1, "limit": 1})

    assert response.status_code == 200
    assert response.json()["total"] == 2
    assert len(response.json()["items"]) == 1
    assert response.json()["items"][0]["post_type"] == "LOST"


def test_standard_postgres_url_uses_pg8000() -> None:
    assert normalize_database_url("postgresql://user:password@host:5432/database") == "postgresql+pg8000://user:password@host:5432/database"


def test_mine_requires_auth() -> None:
    app.dependency_overrides.pop(get_current_user)
    assert TestClient(app).get("/api/v1/posts/mine").status_code == 401


def test_mine_returns_only_current_users_posts_regardless_of_status() -> None:
    client = TestClient(app)
    mine_active = create_post(client, description="My active lost wallet")
    mine_resolved = create_post(client, description="My resolved item")
    client.put(f"/api/v1/posts/{mine_resolved['id']}", json={"location": "Somewhere"})

    app.dependency_overrides[get_current_user] = other_user
    create_post(client, description="Someone else's post")
    app.dependency_overrides[get_current_user] = owner

    response = client.get("/api/v1/posts/mine")
    assert response.status_code == 200
    ids = {p["id"] for p in response.json()}
    assert ids == {mine_active["id"], mine_resolved["id"]}
