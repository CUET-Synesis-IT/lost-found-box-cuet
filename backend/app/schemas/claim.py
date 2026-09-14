from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.claim import ClaimStatus
from app.database.models.post import PostStatus


class ClaimCreate(BaseModel):
    found_post_id: UUID
    related_lost_post_id: UUID
    message: Annotated[str, Field(max_length=2000)] | None = None


class ClaimantInfo(BaseModel):
    """Prompt 12: "claimant information according to privacy requirements" -
    Profile only stores a CUET-verified email (no name field exists), so
    that's the only thing that can be shown. Nothing more granular to leak."""

    model_config = ConfigDict(from_attributes=True)
    email: str


class RelatedPostSummary(BaseModel):
    """Just enough for the finder to recognize which LOST post this claim
    is about, without a second API call."""

    model_config = ConfigDict(from_attributes=True)
    id: UUID
    category: str
    description: str
    location: str
    status: PostStatus


class ClaimRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    found_post_id: UUID
    claimant_id: UUID
    claimant: ClaimantInfo
    related_lost_post_id: UUID
    related_lost_post: RelatedPostSummary
    message: str | None
    status: ClaimStatus
    created_at: datetime
    updated_at: datetime
