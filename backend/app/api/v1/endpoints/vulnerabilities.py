from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User, Vulnerability
from app.schemas.vulnerability import VulnerabilityUpdate, VulnerabilityResponse

router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])


@router.get("/", response_model=List[VulnerabilityResponse])
async def list_vulnerabilities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    severity: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0)
):
    query = select(Vulnerability)
    
    if severity:
        query = query.where(Vulnerability.severity == severity.lower())
    
    query = query.order_by(Vulnerability.cvss_score.desc().nullslast()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{cve_id}", response_model=VulnerabilityResponse)
async def get_vulnerability(
    cve_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Vulnerability).where(Vulnerability.cve_id == cve_id.upper())
    )
    vulnerability = result.scalar_one_or_none()
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    return vulnerability


@router.put("/{cve_id}", response_model=VulnerabilityResponse)
async def update_vulnerability(
    cve_id: str,
    vuln_update: VulnerabilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Vulnerability).where(Vulnerability.cve_id == cve_id.upper())
    )
    vulnerability = result.scalar_one_or_none()
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    
    update_data = vuln_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vulnerability, field, value)
    
    await db.commit()
    await db.refresh(vulnerability)
    return vulnerability


@router.get("/search/cve")
async def search_vulnerability(
    cve_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Vulnerability).where(Vulnerability.cve_id.ilike(f"%{cve_id}%"))
    )
    vulnerabilities = result.scalars().all()
    return {"vulnerabilities": vulnerabilities, "total": len(vulnerabilities)}
