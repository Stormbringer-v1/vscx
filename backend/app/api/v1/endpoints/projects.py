from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.base import Project
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Project).where(Project.owner_id == current_user.id))
    return result.scalars().all()


@router.post("/")
async def create_project(
    name: str,
    description: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(name=name, description=description, owner_id=current_user.id)
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project
