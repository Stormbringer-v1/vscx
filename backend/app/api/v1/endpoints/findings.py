from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.models.base import Project, Finding
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User
from app.schemas.finding import FindingUpdate, FindingResponse

router = APIRouter(prefix="/findings", tags=["findings"])


async def get_project_for_user(project_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[FindingResponse])
async def list_findings(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    query = select(Finding).where(Finding.project_id == project_id)
    
    if severity:
        query = query.where(Finding.severity == severity.lower())
    if status:
        query = query.where(Finding.status == status.lower())
    
    query = query.order_by(Finding.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding(
    finding_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Finding).where(Finding.id == finding_id, Finding.project_id == project_id)
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.put("/{finding_id}", response_model=FindingResponse)
async def update_finding(
    finding_id: int,
    finding_update: FindingUpdate,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Finding).where(Finding.id == finding_id, Finding.project_id == project_id)
    )
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    update_data = finding_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(finding, field, value)
    
    await db.commit()
    await db.refresh(finding)
    return finding


@router.get("/stats/summary")
async def get_findings_summary(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(
            func.count(Finding.id).label("total"),
            func.count(Finding.id).filter(Finding.severity == "critical").label("critical"),
            func.count(Finding.id).filter(Finding.severity == "high").label("high"),
            func.count(Finding.id).filter(Finding.severity == "medium").label("medium"),
            func.count(Finding.id).filter(Finding.severity == "low").label("low"),
            func.count(Finding.id).filter(Finding.severity == "info").label("info"),
            func.count(Finding.id).filter(Finding.status == "open").label("open"),
            func.count(Finding.id).filter(Finding.status == "resolved").label("resolved"),
        ).where(Finding.project_id == project_id)
    )
    row = result.one()
    
    return {
        "total": row.total or 0,
        "by_severity": {
            "critical": row.critical or 0,
            "high": row.high or 0,
            "medium": row.medium or 0,
            "low": row.low or 0,
            "info": row.info or 0
        },
        "by_status": {
            "open": row.open or 0,
            "resolved": row.resolved or 0
        }
    }
