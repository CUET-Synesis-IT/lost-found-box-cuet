from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.database.models.post import PostType


class SimilarPostRead(BaseModel):
    post_id: UUID
    post_type: PostType
    category: str
    description: str
    location: str
    event_time: datetime
    image_url: str | None
    similarity_score: float
