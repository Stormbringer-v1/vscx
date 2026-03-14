import asyncio
from datetime import datetime
from celery import Task

from app.services.celery_app import celery_app
from app.core.database import async_session
from app.services.scanners import run_scan


@celery_app.task(bind=True)
def execute_scan(self: Task, scan_id: int):
    async def _execute_scan():
        from sqlalchemy import select
        from app.models.base import Scan, ScanStatus, Finding, Asset
        
        async with async_session() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one_or_none()
            if not scan:
                return {"error": "Scan not found"}
            
            result = await db.execute(select(Asset).where(Asset.project_id == scan.project_id))
            assets = result.scalars().all()
            asset_map = {a.ip_address: a.id for a in assets if a.ip_address}
            asset_map.update({a.hostname: a.id for a in assets if a.hostname})
            asset_map.update({a.url: a.id for a in assets if a.url})
            
            scan.status = ScanStatus.RUNNING.value
            scan.started_at = datetime.utcnow()
            scan.progress = 10
            await db.commit()
            
            self.update_state(state="PROGRESS", meta={"status": "Running scan", "progress": 20})
            
            scan_result = await run_scan(scan.scan_type, scan.targets)
            
            if not scan_result.get("success"):
                scan.status = ScanStatus.FAILED.value
                scan.progress = 100
                scan.completed_at = datetime.utcnow()
                await db.commit()
                return {"error": scan_result.get("error"), "success": False}
            
            self.update_state(state="PROGRESS", meta={"status": "Saving findings", "progress": 70})
            
            findings_count = 0
            for finding_data in scan_result.get("findings", []):
                affected = finding_data.get("affected_component", "")
                matched_asset_id = None
                for key, asset_id in asset_map.items():
                    if key and key in affected:
                        matched_asset_id = asset_id
                        break
                
                finding = Finding(
                    scan_id=scan_id,
                    asset_id=matched_asset_id,
                    project_id=scan.project_id,
                    title=finding_data.get("title", "Unknown"),
                    description=finding_data.get("description", ""),
                    severity=finding_data.get("severity", "medium"),
                    cve_id=finding_data.get("cve_id"),
                    cvss_score=finding_data.get("cvss_score"),
                    affected_component=affected,
                    status="open"
                )
                db.add(finding)
                findings_count += 1
            
            scan.status = ScanStatus.COMPLETED.value
            scan.progress = 100
            scan.completed_at = datetime.utcnow()
            await db.commit()
            
            return {
                "scan_id": scan_id,
                "status": "completed",
                "findings_count": findings_count
            }
    
    return asyncio.run(_execute_scan())


@celery_app.task
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
