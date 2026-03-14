from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User

router = APIRouter(prefix="/scans", tags=["scans"])


@router.get("/")
async def list_scans(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"project_id": project_id, "scans": []}


@router.post("/")
async def create_scan(
    name: str,
    scan_type: str,
    targets: str,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"id": 1, "name": name, "status": "pending"}
