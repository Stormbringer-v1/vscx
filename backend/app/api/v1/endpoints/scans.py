from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.base import Project, Scan, ScanStatus
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User
from app.schemas.scan import ScanCreate, ScanUpdate, ScanResponse

router = APIRouter(prefix="/scans", tags=["scans"])


async def get_project_for_user(project_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[ScanResponse])
async def list_scans(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    result = await db.execute(
        select(Scan).where(Scan.project_id == project_id).order_by(Scan.created_at.desc())
    )
    return result.scalars().all()


@router.post("/", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan: ScanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(scan.project_id, current_user.id, db)
    
    db_scan = Scan(
        project_id=scan.project_id,
        name=scan.name,
        scan_type=scan.scan_type,
        targets=scan.targets,
        status=ScanStatus.PENDING.value,
        progress=0,
        created_by=current_user.id
    )
    db.add(db_scan)
    await db.commit()
    await db.refresh(db_scan)
    return db_scan


@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(
    scan_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.project_id == project_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Scan).where(Scan.id == scan_id, Scan.project_id == project_id)
    )
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    await db.delete(scan)
    await db.commit()
    return None
