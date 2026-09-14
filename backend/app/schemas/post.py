from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.database.models.post import PostStatus, PostType

CATEGORIES = ("Electronics", "Wallet", "Keys", "ID Card", "Documents", "Bag", "Books", "Clothing", "Accessories", "Money", "Other")
TextField = Annotated[str, Field(min_length=1, max_length=2000)]


class PostCreate(BaseModel):
    post_type: PostType
    category: str
    description: TextField
    location: Annotated[str, Field(min_length=1, max_length=300)]
    event_time: datetime
    image_url: HttpUrl | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        if value not in CATEGORIES:
            raise ValueError("category must be one of the configured MVP categories")
        return value

    @field_validator("description", "location")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("value must not be blank")
        return value


class PostUpdate(BaseModel):
    post_type: PostType | None = None
    category: str | None = None
    description: Annotated[str, Field(min_length=1, max_length=2000)] | None = None
    location: Annotated[str, Field(min_length=1, max_length=300)] | None = None
    event_time: datetime | None = None
    image_url: HttpUrl | None = None

    @field_validator("category")
    @classmethod
    def validate_optional_category(cls, value: str | None) -> str | None:
        if value is not None and value not in CATEGORIES:
            raise ValueError("category must be one of the configured MVP categories")
        return value

    @field_validator("description", "location")
    @classmethod
    def trim_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("value must not be blank")
        return value


class PostRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    post_type: PostType
    category: str
    description: str
    location: str
    event_time: datetime
    image_url: str | None
    status: PostStatus
    created_at: datetime
    updated_at: datetime


class PostListResponse(BaseModel):
    items: list[PostRead]
    page: int
    limit: int
    total: int
