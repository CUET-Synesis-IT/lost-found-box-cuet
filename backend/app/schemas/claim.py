from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.database.models.claim import ClaimStatus


class ClaimCreate(BaseModel):
    found_post_id: UUID
    related_lost_post_id: UUID
    message: Annotated[str, Field(max_length=2000)] | None = None


class ClaimRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    found_post_id: UUID
    claimant_id: UUID
    related_lost_post_id: UUID
    message: str | None
    status: ClaimStatus
    created_at: datetime
    updated_at: datetime
