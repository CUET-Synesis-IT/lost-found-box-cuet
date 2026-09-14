from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import CurrentUser
from app.database.session import get_db_session
from app.schemas.claim import ClaimCreate, ClaimRead
from app.services.claim_service import ClaimService

router = APIRouter(prefix="/api/v1/claims", tags=["claims"])
service = ClaimService()


@router.post("", response_model=ClaimRead, status_code=status.HTTP_201_CREATED)
def create_claim(
    payload: ClaimCreate,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ClaimRead:
    return service.create_claim(session, UUID(current_user.id), payload)


@router.get("/my", response_model=list[ClaimRead])
def list_my_claims(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> list[ClaimRead]:
    return service.list_my_claims(session, UUID(current_user.id))


@router.post("/{claim_id}/approve", response_model=ClaimRead)
def approve_claim(
    claim_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ClaimRead:
    return service.approve_claim(session, claim_id, UUID(current_user.id))


@router.post("/{claim_id}/reject", response_model=ClaimRead)
def reject_claim(
    claim_id: UUID,
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_db_session)],
) -> ClaimRead:
    return service.reject_claim(session, claim_id, UUID(current_user.id))
