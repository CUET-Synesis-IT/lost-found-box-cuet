from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class PostType(StrEnum):
    LOST = "LOST"
    FOUND = "FOUND"


class PostStatus(StrEnum):
    ACTIVE = "ACTIVE"
    CLAIM_PENDING = "CLAIM_PENDING"
    RESOLVED = "RESOLVED"
    ARCHIVED = "ARCHIVED"


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String, nullable=False)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False, index=True)
    post_type: Mapped[PostType] = mapped_column(Enum(PostType, name="post_type", native_enum=False), nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String, nullable=False)
    event_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text)
    status: Mapped[PostStatus] = mapped_column(Enum(PostStatus, name="post_status", native_enum=False), nullable=False, default=PostStatus.ACTIVE)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
