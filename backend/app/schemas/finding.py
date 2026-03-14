from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class FindingBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = None
    epss_score: Optional[float] = None
    affected_component: Optional[str] = None
    remediation: Optional[str] = None
    status: str = "open"


class FindingCreate(FindingBase):
    scan_id: int
    asset_id: int
    project_id: int


class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    remediation: Optional[str] = None


class FindingResponse(FindingBase):
    id: int
    scan_id: int
    asset_id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True
