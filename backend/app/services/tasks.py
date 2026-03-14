import asyncio
from datetime import datetime
from celery import Task

from app.services.celery_app import celery_app
from app.core.database import async_session


@celery_app.task(bind=True)
def run_scan(self: Task, scan_id: int):
    from sqlalchemy import select, update
    from app.models.base import Scan, ScanStatus
    
    async def _run_scan():
        async with async_session() as db:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one_or_none()
            if not scan:
                return {"error": "Scan not found"}
            
            scan.status = ScanStatus.RUNNING.value
            scan.started_at = datetime.utcnow()
            await db.commit()
            
            return {"scan_id": scan_id, "status": "running"}
    
    return asyncio.run(_run_scan())


@celery_app.task
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
