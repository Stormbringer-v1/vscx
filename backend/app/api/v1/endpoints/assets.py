from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("/")
async def list_assets(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"project_id": project_id, "assets": []}


@router.post("/")
async def create_asset(
    name: str,
    asset_type: str,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return {"id": 1, "name": name, "asset_type": asset_type}
