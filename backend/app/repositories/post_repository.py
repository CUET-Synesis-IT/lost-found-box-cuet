from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.database.models.post import Post, PostStatus, PostType, Profile


class PostRepository:
    def ensure_profile(self, session: Session, user_id: UUID, email: str) -> None:
        """Defensively provision a profile if the auth trigger has not run yet."""
        if session.get(Profile, user_id) is None:
            session.add(Profile(id=user_id, email=email))
            session.flush()

    def get(self, session: Session, post_id: UUID) -> Post | None:
        return session.get(Post, post_id)

    def create(self, session: Session, post: Post) -> Post:
        session.add(post)
        session.flush()
        session.refresh(post)
        return post

    def delete(self, session: Session, post: Post) -> None:
        session.delete(post)
        session.flush()

    def get_active_opposite_type_posts(self, session: Session, post_type: PostType) -> list[Post]:
        opposite_type = PostType.FOUND if post_type == PostType.LOST else PostType.LOST
        return list(session.scalars(
            select(Post).where(Post.post_type == opposite_type, Post.status == PostStatus.ACTIVE)
        ).all())

    def list(self, session: Session, statement: Select[tuple[Post]], page: int, limit: int) -> tuple[list[Post], int]:
        total = session.scalar(select(func.count()).select_from(statement.order_by(None).subquery())) or 0
        items = session.scalars(statement.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
        return list(items), total

    @staticmethod
    def filtered_statement(
        post_type: PostType | None,
        category: str | None,
        status: PostStatus | None,
        search: str | None,
    ) -> Select[tuple[Post]]:
        statement = select(Post)
        if post_type:
            statement = statement.where(Post.post_type == post_type)
        if category:
            statement = statement.where(Post.category == category)
        if status:
            statement = statement.where(Post.status == status)
        else:
            statement = statement.where(Post.status == PostStatus.ACTIVE)
        if search:
            pattern = f"%{search.strip()}%"
            statement = statement.where(or_(Post.description.ilike(pattern), Post.location.ilike(pattern)))
        return statement
