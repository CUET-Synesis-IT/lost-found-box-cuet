from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import CurrentUser
from app.database.models.post import PostStatus, PostType
from app.database.session import get_db_session
from app.schemas.post import CATEGORIES, PostCreate, PostListResponse, PostRead, PostUpdate
from app.schemas.similarity import SimilarPostRead
from app.services.post_service import PostService
from app.services.similarity_service import SimilarityService

router = APIRouter(prefix="/api/v1/posts", tags=["posts"])
service = PostService()
similarity_service = SimilarityService()


@router.post("", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> PostRead:
    return service.create_post(session, UUID(current_user.id), current_user.email, payload)


@router.get("", response_model=PostListResponse)
def list_posts(
    session: Annotated[Session, Depends(get_db_session)],
    post_type: PostType | None = None,
    category: str | None = Query(default=None),
    status_filter: PostStatus | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
) -> PostListResponse:
    if category is not None and category not in CATEGORIES:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="category must be one of the configured MVP categories")
    items, total = service.list_posts(session, post_type, category, status_filter, search, page, limit)
    return PostListResponse(items=items, page=page, limit=limit, total=total)


@router.get("/{post_id}/similar", response_model=list[SimilarPostRead])
def get_similar_posts(
    post_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
    limit: int = Query(default=5, ge=1, le=5),
) -> list[SimilarPostRead]:
    matches = similarity_service.get_similar_posts(session, post_id, limit)
    return [
        SimilarPostRead(
            post_id=post.id,
            post_type=post.post_type,
            category=post.category,
            description=post.description,
            location=post.location,
            event_time=post.event_time,
            image_url=post.image_url,
            similarity_score=score,
        )
        for post, score in matches
    ]


@router.get("/{post_id}", response_model=PostRead)
def get_post(post_id: UUID, session: Annotated[Session, Depends(get_db_session)]) -> PostRead:
    return service.get_post(session, post_id)


@router.put("/{post_id}", response_model=PostRead)
def update_post(
    post_id: UUID,
    payload: PostUpdate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> PostRead:
    return service.update_post(session, post_id, UUID(current_user.id), payload)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> Response:
    service.delete_post(session, post_id, UUID(current_user.id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
