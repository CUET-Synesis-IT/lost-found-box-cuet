from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.claim import Claim, ClaimStatus, Resolution


class ClaimRepository:
    def get(self, session: Session, claim_id: UUID) -> Claim | None:
        return session.get(Claim, claim_id)

    def create(self, session: Session, claim: Claim) -> Claim:
        session.add(claim)
        session.flush()
        session.refresh(claim)
        return claim

    def list_by_claimant(self, session: Session, claimant_id: UUID) -> list[Claim]:
        return list(session.scalars(
            select(Claim).where(Claim.claimant_id == claimant_id).order_by(Claim.created_at.desc())
        ).all())

    def list_by_found_post(self, session: Session, found_post_id: UUID) -> list[Claim]:
        return list(session.scalars(
            select(Claim).where(Claim.found_post_id == found_post_id).order_by(Claim.created_at.desc())
        ).all())

    def count_pending_for_found_post(
        self, session: Session, found_post_id: UUID, exclude_claim_id: UUID | None = None
    ) -> int:
        statement = select(Claim).where(
            Claim.found_post_id == found_post_id, Claim.status == ClaimStatus.PENDING
        )
        if exclude_claim_id is not None:
            statement = statement.where(Claim.id != exclude_claim_id)
        return len(list(session.scalars(statement).all()))

    def create_resolution(self, session: Session, resolution: Resolution) -> Resolution:
        session.add(resolution)
        session.flush()
        return resolution
