import logging
import json
from datetime import datetime
from typing import Any

logger = logging.getLogger("audit")


def log_audit(action: str, user_id: int | None, details: dict[str, Any]):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "user_id": user_id,
        "details": details,
    }
    logger.info(json.dumps(log_entry))


def log_login_attempt(username: str, success: bool, ip_address: str | None = None):
    log_audit(
        action="login_attempt",
        user_id=None,
        details={"username": username, "success": success, "ip_address": ip_address}
    )


def log_scan_execution(scan_id: int, user_id: int, project_id: int, scan_name: str):
    log_audit(
        action="scan_execution",
        user_id=user_id,
        details={"scan_id": scan_id, "project_id": project_id, "scan_name": scan_name}
    )


def log_finding_status_change(finding_id: int, user_id: int, old_status: str, new_status: str):
    log_audit(
        action="finding_status_change",
        user_id=user_id,
        details={"finding_id": finding_id, "old_status": old_status, "new_status": new_status}
    )


def log_project_access(user_id: int, project_id: int, action: str):
    log_audit(
        action=f"project_{action}",
        user_id=user_id,
        details={"project_id": project_id}
    )