from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User

router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])


@router.get("/")
async def list_vulnerabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"vulnerabilities": [], "total": 0}


@router.get("/{cve_id}")
async def get_vulnerability(
    cve_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"cve_id": cve_id}
