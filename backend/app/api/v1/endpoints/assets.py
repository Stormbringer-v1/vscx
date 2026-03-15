from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.models.base import Project, Asset, Finding
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter(prefix="/assets", tags=["assets"])

ASSET_TYPES = ["server", "workstation", "network_device", "container", "web_application", "database", "cloud_resource", "discovered"]


async def get_project_for_user(project_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == user_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/", response_model=List[AssetResponse])
async def list_assets(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    result = await db.execute(
        select(Asset).where(Asset.project_id == project_id).order_by(Asset.created_at.desc())
    )
    return result.scalars().all()


@router.get("/with-stats")
async def list_assets_with_stats(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    finding_counts = (
        select(
            Finding.asset_id,
            func.count(Finding.id).label('total_findings'),
            func.sum(func.cast(Finding.cvss_score, float)).label('cvss_sum')
        )
        .where(Finding.project_id == project_id, Finding.status == 'open')
        .group_by(Finding.asset_id)
        .subquery()
    )
    
    result = await db.execute(
        select(Asset, finding_counts.c.total_findings, finding_counts.c.cvss_sum)
        .outerjoin(finding_counts, Asset.id == finding_counts.c.asset_id)
        .where(Asset.project_id == project_id)
        .order_by(Asset.created_at.desc())
    )
    
    assets_with_stats = []
    for row in result.all():
        asset = row[0]
        total_findings = row[1] or 0
        cvss_sum = row[2] or 0.0
        
        critical_count = await db.execute(
            select(func.count(Finding.id))
            .where(Finding.asset_id == asset.id, Finding.status == 'open', Finding.cvss_score >= 9.0)
        )
        high_count = await db.execute(
            select(func.count(Finding.id))
            .where(Finding.asset_id == asset.id, Finding.status == 'open', Finding.cvss_score >= 7.0, Finding.cvss_score < 9.0)
        )
        
        risk_score = min(10, (total_findings * 0.5) + (cvss_sum / 10)) if total_findings > 0 else 0.0
        
        assets_with_stats.append({
            "id": asset.id,
            "name": asset.name,
            "asset_type": asset.asset_type,
            "ip_address": asset.ip_address,
            "hostname": asset.hostname,
            "url": asset.url,
            "description": asset.description,
            "risk_score": round(risk_score, 1),
            "os_info": None,
            "status": None,
            "last_scan": asset.last_scan_at.isoformat() if asset.last_scan_at else None,
            "total_findings": total_findings,
            "critical_count": critical_count.scalar() or 0,
            "high_count": high_count.scalar() or 0,
            "created_at": asset.created_at.isoformat() if asset.created_at else None,
        })
    
    return assets_with_stats


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(asset.project_id, current_user.id, db)
    
    if asset.asset_type not in ASSET_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid asset_type. Must be one of: {', '.join(ASSET_TYPES)}"
        )
    
    db_asset = Asset(
        project_id=asset.project_id,
        name=asset.name,
        asset_type=asset.asset_type,
        ip_address=asset.ip_address,
        hostname=asset.hostname,
        url=asset.url,
        description=asset.description
    )
    db.add(db_asset)
    await db.commit()
    await db.refresh(db_asset)
    return db_asset


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.project_id == project_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_update: AssetUpdate,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.project_id == project_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    update_data = asset_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    await db.commit()
    await db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    asset_id: int,
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await get_project_for_user(project_id, current_user.id, db)
    
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.project_id == project_id)
    )
    asset = result.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    await db.delete(asset)
    await db.commit()
    return None
