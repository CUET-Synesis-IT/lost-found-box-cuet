"""Replaceable Version 1 post similarity implementation."""

from dataclasses import dataclass
from datetime import datetime
from difflib import SequenceMatcher
from collections import Counter
from math import log, sqrt
import re
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.database.models.post import Post
from app.repositories.post_repository import PostRepository


@dataclass(frozen=True)
class SimilarityWeights:
    description: float = 0.40
    category: float = 0.30
    location: float = 0.20
    time: float = 0.10
    time_decay_hours: float = 24.0


class TfidfTextSimilarity:
    """Text scorer behind a small interface so embeddings can replace it later."""

    def score(self, left: str, right: str) -> float:
        documents = [self._tokens(left), self._tokens(right)]
        if not documents[0] or not documents[1]:
            return 0.0
        document_frequency = Counter(token for document in documents for token in set(document))
        vectors: list[dict[str, float]] = []
        for document in documents:
            frequencies = Counter(document)
            total_terms = len(document)
            vectors.append({
                token: (count / total_terms) * (log(3 / (1 + document_frequency[token])) + 1)
                for token, count in frequencies.items()
            })
        left_vector, right_vector = vectors
        dot_product = sum(value * right_vector.get(token, 0.0) for token, value in left_vector.items())
        left_norm = sqrt(sum(value * value for value in left_vector.values()))
        right_norm = sqrt(sum(value * value for value in right_vector.values()))
        return dot_product / (left_norm * right_norm) if left_norm and right_norm else 0.0

    @staticmethod
    def _tokens(value: str) -> list[str]:
        return re.findall(r"\b\w+\b", value.lower())


class SimilarityService:
    def __init__(
        self,
        repository: PostRepository | None = None,
        text_similarity: TfidfTextSimilarity | None = None,
        weights: SimilarityWeights | None = None,
    ) -> None:
        self.repository = repository or PostRepository()
        self.text_similarity = text_similarity or TfidfTextSimilarity()
        self.weights = weights or SimilarityWeights()

    def calculate_similarity(self, post_a: Post, post_b: Post) -> float:
        """Return the normalized weighted score for two posts in [0, 1]."""
        description_score = self.text_similarity.score(post_a.description, post_b.description)
        category_score = float(post_a.category == post_b.category)
        location_score = self._text_location_score(post_a.location, post_b.location)
        time_score = self._time_score(post_a.event_time, post_b.event_time)
        score = (
            description_score * self.weights.description
            + category_score * self.weights.category
            + location_score * self.weights.location
            + time_score * self.weights.time
        )
        return max(0.0, min(1.0, score))

    def get_similar_posts(self, session: Session, post_id: UUID, limit: int = 5) -> list[tuple[Post, float]]:
        if limit < 1 or limit > 5:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="limit must be between 1 and 5.")
        source = self.repository.get(session, post_id)
        if not source:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        candidates = self.repository.get_active_opposite_type_posts(session, source.post_type)
        scored = [(candidate, self.calculate_similarity(source, candidate)) for candidate in candidates]
        return sorted(scored, key=lambda item: (-item[1], item[0].created_at, str(item[0].id)))[:limit]

    @staticmethod
    def _normalize(value: str) -> str:
        return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", value.lower())).strip()

    def _text_location_score(self, left: str, right: str) -> float:
        return SequenceMatcher(None, self._normalize(left), self._normalize(right)).ratio()

    def _time_score(self, left: datetime, right: datetime) -> float:
        hours_difference = abs((left - right).total_seconds()) / 3600
        return 1 / (1 + hours_difference / self.weights.time_decay_hours)
