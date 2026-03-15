import asyncio
import logging
import re
from datetime import datetime
from celery import Task

from app.services.celery_app import celery_app
from app.core.database import async_session
from app.services.scanners import run_scan
from app.services.scan_profiles import SCAN_PROFILES

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, acks_late=True, reject_on_worker_lost=True)
def execute_scan(self: Task, scan_id: int):
    async def _execute_scan():
        from sqlalchemy import select
        from app.models.base import Scan, ScanStatus, Finding, Asset
        
        try:
            async with async_session() as db:
                result = await db.execute(select(Scan).where(Scan.id == scan_id))
                scan = result.scalar_one_or_none()
                if not scan:
                    logger.error(f"Scan {scan_id} not found")
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
                
                scan_type = scan.scan_type
                profile = SCAN_PROFILES.get(scan_type)
                
                if profile:
                    all_findings = []
                    steps = profile["steps"]
                    for i, step in enumerate(steps):
                        progress = 10 + int(80 * i / len(steps))
                        self.update_state(state="PROGRESS", meta={"status": f"Running {step['scanner']}...", "progress": progress})
                        
                        result = await run_scan(step["scanner"], scan.targets, step.get("options", ""))
                        if result.get("success"):
                            all_findings.extend(result.get("findings", []))
                        else:
                            logger.warning(f"Scanner {step['scanner']} failed: {result.get('error')}")
                    
                    scan_result = {"findings": all_findings, "success": True}
                else:
                    scan_result = await run_scan(scan_type, scan.targets)
                
                if not scan_result.get("success"):
                    scan.status = ScanStatus.FAILED.value
                    scan.progress = 100
                    scan.completed_at = datetime.utcnow()
                    await db.commit()
                    logger.error(f"Scan {scan_id} failed: {scan_result.get('error')}")
                    return {"error": scan_result.get("error"), "success": False}
                
                if scan_type in ["quick", "standard", "aggressive"]:
                    discovered_ips = set()
                    for finding_data in scan_result.get("findings", []):
                        affected = finding_data.get("affected_component", "")
                        ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
                        ips = re.findall(ip_pattern, affected)
                        for ip in ips:
                            if ip not in asset_map and ip not in discovered_ips:
                                discovered_ips.add(ip)
                    
                    for ip in discovered_ips:
                        new_asset = Asset(
                            project_id=scan.project_id,
                            name=f"Discovered Host {ip}",
                            asset_type="discovered",
                            ip_address=ip,
                        )
                        db.add(new_asset)
                        await db.flush()
                        asset_map[ip] = new_asset.id
                        logger.info(f"Auto-created asset for discovered IP: {ip}")
                    
                    if discovered_ips:
                        await db.commit()
                        result = await db.execute(select(Asset).where(Asset.project_id == scan.project_id))
                        assets = result.scalars().all()
                        asset_map = {a.ip_address: a.id for a in assets if a.ip_address}
                        asset_map.update({a.hostname: a.id for a in assets if a.hostname})
                        asset_map.update({a.url: a.id for a in assets if a.url})
                
                self.update_state(state="PROGRESS", meta={"status": "Saving findings", "progress": 90})
                
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
                
                logger.info(f"Scan {scan_id} completed with {findings_count} findings")
                return {
                    "scan_id": scan_id,
                    "status": "completed",
                    "findings_count": findings_count
                }
        except Exception as e:
            logger.exception(f"Scan {scan_id} failed with exception: {e}")
            try:
                async with async_session() as db:
                    result = await db.execute(select(Scan).where(Scan.id == scan_id))
                    scan = result.scalar_one_or_none()
                    if scan:
                        scan.status = ScanStatus.FAILED.value
                        scan.progress = 100
                        scan.completed_at = datetime.utcnow()
                        await db.commit()
            except Exception as db_error:
                logger.error(f"Failed to update scan status to FAILED: {db_error}")
            raise
    
    return asyncio.run(_execute_scan())


@celery_app.task
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
