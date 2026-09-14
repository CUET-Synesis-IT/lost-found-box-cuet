from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.models.claim import Claim, ClaimStatus, Resolution
from app.database.models.post import PostStatus, PostType
from app.repositories.claim_repository import ClaimRepository
from app.repositories.post_repository import PostRepository
from app.schemas.claim import ClaimCreate


class ClaimService:
    def __init__(
        self,
        repository: ClaimRepository | None = None,
        post_repository: PostRepository | None = None,
    ) -> None:
        self.repository = repository or ClaimRepository()
        self.post_repository = post_repository or PostRepository()

    def create_claim(self, session: Session, claimant_id: UUID, payload: ClaimCreate) -> Claim:
        """IMPLEMENTATION_PLAN.md section 30 - Claim Validation. All eight
        checks are enforced here even though the DB migration's
        validate_claim_relationship trigger also enforces most of them,
        because that trigger doesn't run under SQLite (used in tests)."""
        found_post = self.post_repository.get(session, payload.found_post_id)
        if not found_post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found post not found.")
        if found_post.post_type != PostType.FOUND:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="found_post_id must reference a FOUND post.",
            )
        if found_post.status not in (PostStatus.ACTIVE, PostStatus.CLAIM_PENDING):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="This item is no longer available to claim."
            )
        if found_post.user_id == claimant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You cannot claim your own found post."
            )

        lost_post = self.post_repository.get(session, payload.related_lost_post_id)
        if not lost_post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Related lost post not found.")
        if lost_post.post_type != PostType.LOST:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="related_lost_post_id must reference a LOST post.",
            )
        if lost_post.user_id != claimant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="The related lost post must belong to you."
            )
        if lost_post.status != PostStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Your lost post is no longer active."
            )

        claim = Claim(
            found_post_id=found_post.id,
            claimant_id=claimant_id,
            related_lost_post_id=lost_post.id,
            message=payload.message,
        )
        try:
            self.repository.create(session, claim)
            # First PENDING claim moves the found post out of ACTIVE (plan
            # section 29). Leave it alone if it's already CLAIM_PENDING from
            # an earlier claim - multiple concurrent claims are allowed.
            if found_post.status != PostStatus.CLAIM_PENDING:
                found_post.status = PostStatus.CLAIM_PENDING
            session.commit()
            session.refresh(claim)
            return claim
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not create claim.") from None

    def list_my_claims(self, session: Session, claimant_id: UUID) -> list[Claim]:
        return self.repository.list_by_claimant(session, claimant_id)

    def list_claims_for_post(self, session: Session, found_post_id: UUID, current_user_id: UUID) -> list[Claim]:
        found_post = self.post_repository.get(session, found_post_id)
        if not found_post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found.")
        if found_post.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner of the found post may view received claims.",
            )
        return self.repository.list_by_found_post(session, found_post_id)

    def _get_claim_or_404(self, session: Session, claim_id: UUID) -> Claim:
        claim = self.repository.get(session, claim_id)
        if not claim:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found.")
        return claim

    def approve_claim(self, session: Session, claim_id: UUID, current_user_id: UUID) -> Claim:
        """IMPLEMENTATION_PLAN.md section 32 - Claim Approval Transaction.
        Claim=APPROVED, both posts=RESOLVED, and the Resolution row are all
        written in one commit - if anything raises, the whole thing rolls
        back so the system can never end up in a half-resolved state."""
        claim = self._get_claim_or_404(session, claim_id)
        if claim.status != ClaimStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only a PENDING claim can be approved.")

        found_post = self.post_repository.get(session, claim.found_post_id)
        lost_post = self.post_repository.get(session, claim.related_lost_post_id)
        if not found_post or not lost_post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Related post could not be found.")
        if found_post.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner of the found post may approve this claim.",
            )
        if lost_post.status != PostStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="The related lost post is no longer active."
            )

        try:
            claim.status = ClaimStatus.APPROVED
            found_post.status = PostStatus.RESOLVED
            lost_post.status = PostStatus.RESOLVED
            self.repository.create_resolution(
                session,
                Resolution(lost_post_id=lost_post.id, found_post_id=found_post.id, claim_id=claim.id),
            )
            # NOTE (known gap, intentionally left as-is): any other still-
            # PENDING claims on this found post are not auto-rejected here.
            # IMPLEMENTATION_PLAN.md section 32 doesn't specify this, and
            # the DB migration's triggers don't do it either - so a finder
            # could see a stale PENDING claim against an already-RESOLVED
            # post. Worth deciding deliberately (and adding to both this
            # service and the migration) rather than silently patching in
            # a behavior the rest of the schema doesn't agree with.
            session.commit()
            session.refresh(claim)
            return claim
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not approve claim.") from None

    def reject_claim(self, session: Session, claim_id: UUID, current_user_id: UUID) -> Claim:
        """IMPLEMENTATION_PLAN.md section 32.1 - Claim Rejection Behavior."""
        claim = self._get_claim_or_404(session, claim_id)
        if claim.status != ClaimStatus.PENDING:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only a PENDING claim can be rejected.")

        found_post = self.post_repository.get(session, claim.found_post_id)
        if not found_post:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Related post could not be found.")
        if found_post.user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the owner of the found post may reject this claim.",
            )

        try:
            claim.status = ClaimStatus.REJECTED
            remaining_pending = self.repository.count_pending_for_found_post(
                session, found_post.id, exclude_claim_id=claim.id
            )
            if remaining_pending == 0 and found_post.status == PostStatus.CLAIM_PENDING:
                found_post.status = PostStatus.ACTIVE
            session.commit()
            session.refresh(claim)
            return claim
        except SQLAlchemyError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Could not reject claim.") from None
