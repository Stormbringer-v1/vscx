from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, case
from typing import List, Optional

from app.core.database import get_db
from app.models.base import Project, Finding, Asset, Scan
from app.api.v1.endpoints.auth import get_current_user
from app.models.base import User
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/remediation/{finding_id}")
async def get_remediation_suggestion(
    finding_id: int,
    project_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Finding).where(Finding.id == finding_id, Finding.project_id == project_id)
    )
    finding = result.scalar_one_or_none()
    if not finding:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Finding not found")
    
    service = AIService()
    try:
        suggestion = await service.generate_remediation_suggestion(
            cve_id=finding.cve_id,
            title=finding.title,
            description=finding.description or "",
            severity=finding.severity,
            affected_component=finding.affected_component or "",
            cvss_score=finding.cvss_score
        )
        return suggestion
    finally:
        await service.close()


@router.post("/remediation/batch")
async def get_batch_remediation(
    project_id: int,
    severity: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Finding).where(Finding.project_id == project_id)
    
    if severity:
        query = query.where(Finding.severity == severity.lower())
    
    query = query.order_by(
        case(
            (Finding.severity == "critical", 1),
            (Finding.severity == "high", 2),
            (Finding.severity == "medium", 3),
            (Finding.severity == "low", 4),
            else_=5
        )
    ).limit(limit)
    
    result = await db.execute(query)
    findings = result.scalars().all()
    
    findings_data = [
        {
            "id": f.id,
            "cve_id": f.cve_id,
            "title": f.title,
            "description": f.description,
            "severity": f.severity,
            "affected_component": f.affected_component,
            "cvss_score": f.cvss_score
        }
        for f in findings
    ]
    
    service = AIService()
    try:
        suggestions = await service.generate_batch_remediation(findings_data)
        return {"suggestions": suggestions, "count": len(suggestions)}
    finally:
        await service.close()


@router.get("/report/{project_id}")
async def generate_project_report(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = project_result.scalar_one_or_none()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    
    findings_result = await db.execute(
        select(Finding).where(Finding.project_id == project_id)
    )
    findings = findings_result.scalars().all()
    
    assets_result = await db.execute(
        select(Asset).where(Asset.project_id == project_id)
    )
    assets = assets_result.scalars().all()
    
    scans_result = await db.execute(
        select(Scan).where(Scan.project_id == project_id)
    )
    scans = scans_result.scalars().all()
    
    findings_data = [
        {
            "cve_id": f.cve_id,
            "title": f.title,
            "description": f.description,
            "severity": f.severity,
            "affected_component": f.affected_component,
            "cvss_score": f.cvss_score,
            "status": f.status
        }
        for f in findings
    ]
    
    service = AIService()
    try:
        report = await service.generate_report(
            project_name=project.name,
            findings=findings_data,
            assets_count=len(assets),
            scans_count=len(scans)
        )
        return report
    finally:
        await service.close()


@router.post("/enrich-findings/{project_id}")
async def enrich_findings_with_ai(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings_result = await db.execute(
        select(Finding).where(Finding.project_id == project_id)
    )
    findings = findings_result.scalars().all()
    
    enriched_count = 0
    service = AIService()
    try:
        for finding in findings:
            if finding.cve_id and not finding.remediation:
                suggestion = await service.generate_remediation_suggestion(
                    cve_id=finding.cve_id,
                    title=finding.title,
                    description=finding.description or "",
                    severity=finding.severity,
                    affected_component=finding.affected_component or "",
                    cvss_score=finding.cvss_score
                )
                
                actions = "\n".join([f"- {action}" for action in suggestion.get("recommended_actions", [])])
                remediation = f"""Priority: {suggestion.get('priority', 'N/A')}
Timeline: {suggestion.get('timeline', 'N/A')}

Recommended Actions:
{actions}

{suggestion.get('specific_guidance', {}).get('update', '')}
"""
                finding.remediation = remediation
                enriched_count += 1
        
        await db.commit()
        return {"enriched": enriched_count, "message": f"Enriched {enriched_count} findings with AI suggestions"}
    finally:
        await service.close()
