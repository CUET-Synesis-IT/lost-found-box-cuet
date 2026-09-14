from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models.post import Post, PostStatus, PostType
from app.repositories.post_repository import PostRepository
from app.schemas.post import PostCreate, PostUpdate


class PostService:
    def __init__(self, repository: PostRepository | None = None) -> None:
        self.repository = repository or PostRepository()

    def create_post(self, session: Session, user_id: UUID, email: str, payload: PostCreate) -> Post:
        values = payload.model_dump()
        if values["image_url"] is not None:
            values["image_url"] = str(values["image_url"])
        self.repository.ensure_profile(session, user_id, email)
        post = Post(user_id=user_id, **values)
        try:
            created = self.repository.create(session, post)
            session.commit()
            return created
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not create post for this user.") from None

    def list_posts(self, session: Session, post_type: PostType | None, category: str | None, post_status: PostStatus | None, search: str | None, page: int, limit: int) -> tuple[list[Post], int]:
        return self.repository.list(session, self.repository.filtered_statement(post_type, category, post_status, search), page, limit)

    def get_post(self, session: Session, post_id: UUID) -> Post:
        post = self.repository.get(session, post_id)
        if not post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        return post

    def update_post(self, session: Session, post_id: UUID, user_id: UUID, payload: PostUpdate) -> Post:
        post = self.get_post(session, post_id)
        self._require_owner(post, user_id)
        changes = payload.model_dump(exclude_unset=True)
        if not changes:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Provide at least one field to update.")
        if changes.get("image_url") is not None:
            changes["image_url"] = str(changes["image_url"])
        for field, value in changes.items():
            setattr(post, field, value)
        try:
            session.commit()
            session.refresh(post)
            return post
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Post could not be updated.") from None

    def delete_post(self, session: Session, post_id: UUID, user_id: UUID) -> None:
        post = self.get_post(session, post_id)
        self._require_owner(post, user_id)
        try:
            self.repository.delete(session, post)
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Posts with claims cannot be deleted.") from None

    @staticmethod
    def _require_owner(post: Post, user_id: UUID) -> None:
        if post.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to modify this post.")
