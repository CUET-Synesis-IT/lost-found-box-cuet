from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.models.post import Base


class ClaimStatus(StrEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Claim(Base):
    """Mirrors supabase/migrations/202609140001_initial_schema.sql:public.claims.

    The DB migration enforces claim-relationship validity (found post is
    FOUND, related post is LOST and belongs to the claimant, claimant
    doesn't own the found post) via a plpgsql trigger. SQLite (used in
    tests) can't run that trigger, so ClaimService re-checks the same rules
    in Python - see IMPLEMENTATION_PLAN.md section 30.
    """

    __tablename__ = "claims"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    found_post_id: Mapped[UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    claimant_id: Mapped[UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    related_lost_post_id: Mapped[UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="RESTRICT"), nullable=False
    )
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[ClaimStatus] = mapped_column(
        Enum(ClaimStatus, name="claim_status", native_enum=False),
        nullable=False,
        default=ClaimStatus.PENDING,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class Resolution(Base):
    """Mirrors public.resolutions. One row per (lost_post, found_post, claim) -
    created only inside ClaimService.approve_claim's atomic transaction."""

    __tablename__ = "resolutions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    lost_post_id: Mapped[UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    found_post_id: Mapped[UUID] = mapped_column(
        ForeignKey("posts.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    claim_id: Mapped[UUID] = mapped_column(
        ForeignKey("claims.id", ondelete="RESTRICT"), nullable=False, unique=True
    )
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
