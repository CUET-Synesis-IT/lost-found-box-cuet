from app.api.dependencies import get_current_user
from app.main import app
from tests.test_posts import (
    OWNER_ID,
    TestingSession,
    create_post,
    other_user,
    owner,
)
from tests.test_posts import setup_function as posts_setup_function
from tests.test_posts import teardown_function as posts_teardown_function
from fastapi.testclient import TestClient

setup_function = posts_setup_function
teardown_function = posts_teardown_function


def _new_user(email: str):
    """Creates a fresh Profile row and returns a CurrentUser-returning
    function usable with app.dependency_overrides[get_current_user]."""
    from uuid import uuid4
    from app.core.security import CurrentUser
    from app.database.models.post import Profile

    user_id = uuid4()
    with TestingSession() as session:
        session.add(Profile(id=user_id, email=email))
        session.commit()

    def _current() -> CurrentUser:
        return CurrentUser(id=str(user_id), email=email)

    return user_id, _current


def _claim_payload(found_post_id: str, lost_post_id: str, **overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "found_post_id": found_post_id,
        "related_lost_post_id": lost_post_id,
        "message": "I think this is mine.",
    }
    data.update(overrides)
    return data


def _make_lost_and_found(client: TestClient) -> tuple[dict, dict]:
    """OWNER posts LOST, then OTHER posts FOUND. Returns (lost, found)."""
    lost = create_post(client, description="Black wallet with CUET ID")
    app.dependency_overrides[get_current_user] = other_user
    found = create_post(client, post_type="FOUND", description="Black wallet with CUET ID")
    app.dependency_overrides[get_current_user] = owner
    return lost, found


def test_owner_can_claim_someone_elses_found_post() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)

    response = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"]))

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "PENDING"
    assert body["claimant_id"] == str(OWNER_ID)

    found_after = client.get(f"/api/v1/posts/{found['id']}").json()
    assert found_after["status"] == "CLAIM_PENDING"


def test_cannot_claim_own_found_post() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    # Claim using the FOUND post's own owner as claimant - reuse `lost` from
    # OWNER but attempt to claim OWNER's own... instead directly test: OTHER
    # (found post owner) tries to claim their own found post.
    app.dependency_overrides[get_current_user] = other_user
    other_lost = create_post(client, description="Some other lost item")
    response = client.post("/api/v1/claims", json=_claim_payload(found["id"], other_lost["id"]))

    assert response.status_code == 403


def test_related_lost_post_must_belong_to_claimant() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    # A third user (neither the found post's owner nor the lost post's
    # owner) tries to claim `found` using OWNER's `lost` post - isolates
    # the "related lost post must belong to claimant" rule specifically,
    # separate from the "can't claim your own found post" rule.
    _, third_user = _new_user("third@student.cuet.ac.bd")
    app.dependency_overrides[get_current_user] = third_user

    response = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"]))

    assert response.status_code == 403


def test_found_post_type_and_lost_post_type_are_enforced() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)

    # found_post_id pointing at a LOST post is invalid
    response = client.post("/api/v1/claims", json=_claim_payload(lost["id"], lost["id"]))
    assert response.status_code == 422


def test_get_my_claims_returns_claimants_claims() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"]))

    response = client.get("/api/v1/claims/my")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["claimant_id"] == str(OWNER_ID)


def test_only_found_post_owner_can_view_received_claims() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"]))

    # OWNER (the claimant, not the found-post owner) tries to view received claims
    forbidden = client.get(f"/api/v1/posts/{found['id']}/claims")
    assert forbidden.status_code == 403

    # OTHER (the found-post owner) can view them
    app.dependency_overrides[get_current_user] = other_user
    allowed = client.get(f"/api/v1/posts/{found['id']}/claims")
    assert allowed.status_code == 200
    assert len(allowed.json()) == 1


def test_only_found_post_owner_can_approve() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    claim = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"])).json()

    # OWNER (claimant) tries to approve their own claim - forbidden
    forbidden = client.post(f"/api/v1/claims/{claim['id']}/approve")
    assert forbidden.status_code == 403


def test_approve_atomically_resolves_both_posts_and_creates_resolution() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    claim = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"])).json()

    app.dependency_overrides[get_current_user] = other_user  # found post owner
    response = client.post(f"/api/v1/claims/{claim['id']}/approve")

    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"

    lost_after = client.get(f"/api/v1/posts/{lost['id']}").json()
    found_after = client.get(f"/api/v1/posts/{found['id']}").json()
    assert lost_after["status"] == "RESOLVED"
    assert found_after["status"] == "RESOLVED"

    with TestingSession() as session:
        from app.database.models.claim import Resolution
        from uuid import UUID
        resolution = session.query(Resolution).filter_by(claim_id=UUID(claim["id"])).first()
        assert resolution is not None
        assert str(resolution.lost_post_id) == lost["id"]
        assert str(resolution.found_post_id) == found["id"]


def test_cannot_approve_a_non_pending_claim_twice() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    claim = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"])).json()

    app.dependency_overrides[get_current_user] = other_user
    first = client.post(f"/api/v1/claims/{claim['id']}/approve")
    assert first.status_code == 200

    second = client.post(f"/api/v1/claims/{claim['id']}/approve")
    assert second.status_code == 409


def test_reject_returns_found_post_to_active_when_no_pending_claims_remain() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    claim = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"])).json()

    app.dependency_overrides[get_current_user] = other_user  # found post owner
    response = client.post(f"/api/v1/claims/{claim['id']}/reject")

    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"

    found_after = client.get(f"/api/v1/posts/{found['id']}").json()
    assert found_after["status"] == "ACTIVE"


def test_reject_one_of_multiple_pending_claims_keeps_post_claim_pending() -> None:
    client = TestClient(app)
    lost, found = _make_lost_and_found(client)
    claim_a = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost["id"])).json()

    # A second, different claimant with their own LOST post also claims the same FOUND post.
    _, second_claimant = _new_user("second@student.cuet.ac.bd")
    app.dependency_overrides[get_current_user] = second_claimant
    lost_2 = create_post(client, description="Another matching wallet")
    claim_b = client.post("/api/v1/claims", json=_claim_payload(found["id"], lost_2["id"])).json()
    assert claim_b["status"] == "PENDING"

    app.dependency_overrides[get_current_user] = other_user  # found post owner
    reject_response = client.post(f"/api/v1/claims/{claim_a['id']}/reject")
    assert reject_response.status_code == 200

    found_after = client.get(f"/api/v1/posts/{found['id']}").json()
    assert found_after["status"] == "CLAIM_PENDING"  # claim_b is still PENDING
