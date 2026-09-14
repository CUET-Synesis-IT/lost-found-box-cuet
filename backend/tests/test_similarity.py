from fastapi.testclient import TestClient
from sqlalchemy import update
from uuid import UUID

from app.database.models.post import Post, PostStatus
from app.services.similarity_service import SimilarityService
from tests.test_posts import (
    TestingSession,
    app,
    create_post,
    setup_function as posts_setup_function,
    teardown_function as posts_teardown_function,
)


def setup_function_wrapper() -> None:
    posts_setup_function()


def teardown_function_wrapper() -> None:
    posts_teardown_function()


# Pytest calls the standard names; wrappers retain the shared posts test setup.
setup_function = setup_function_wrapper
teardown_function = teardown_function_wrapper


def test_same_category_scores_higher_than_different_category() -> None:
    client = TestClient(app)
    source = create_post(client, category="Wallet", description="Black leather wallet", location="Library")
    same_category = create_post(client, post_type="FOUND", category="Wallet", description="keys", location="Hall")
    different_category = create_post(client, post_type="FOUND", category="Keys", description="keys", location="Hall")
    service = SimilarityService()
    with TestingSession() as session:
        source_model = session.get(Post, UUID(source["id"]))
        same_model = session.get(Post, UUID(same_category["id"]))
        different_model = session.get(Post, UUID(different_category["id"]))
        assert service.calculate_similarity(source_model, same_model) > service.calculate_similarity(source_model, different_model)


def test_similar_descriptions_score_higher_than_unrelated_descriptions() -> None:
    client = TestClient(app)
    source = create_post(client, description="Black leather wallet containing student identification card", location="Central Library")
    similar = create_post(client, post_type="FOUND", description="Dark leather wallet found with identification card", location="Central Library")
    unrelated = create_post(client, post_type="FOUND", description="Blue umbrella near the sports field", location="Sports Field")
    service = SimilarityService()
    with TestingSession() as session:
        source_model = session.get(Post, UUID(source["id"]))
        assert service.calculate_similarity(source_model, session.get(Post, UUID(similar["id"]))) > service.calculate_similarity(source_model, session.get(Post, UUID(unrelated["id"])))


def test_similar_endpoint_filters_type_excludes_resolved_and_orders_top_five() -> None:
    client = TestClient(app)
    source = create_post(client, description="Black leather wallet with CUET ID", location="Central Library")
    best = create_post(client, post_type="FOUND", description="Black leather wallet containing CUET ID", location="Central Library")
    resolved = create_post(client, post_type="FOUND", description="Black leather wallet CUET ID", location="Central Library")
    create_post(client, post_type="LOST", description="Black leather wallet CUET ID", location="Central Library")
    for index in range(6):
        create_post(client, post_type="FOUND", description=f"wallet item {index}", location="Hall")
    with TestingSession() as session:
        session.execute(update(Post).where(Post.id == UUID(resolved["id"])).values(status=PostStatus.RESOLVED))
        session.commit()

    response = client.get(f"/api/v1/posts/{source['id']}/similar")

    assert response.status_code == 200
    matches = response.json()
    assert len(matches) == 5
    assert matches[0]["post_id"] == best["id"]
    assert all(item["post_type"] == "FOUND" for item in matches)
    assert resolved["id"] not in [item["post_id"] for item in matches]
    assert all(0 <= item["similarity_score"] <= 1 for item in matches)
