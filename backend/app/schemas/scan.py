from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ScanBase(BaseModel):
    name: str
    scan_type: str
    targets: str


class ScanCreate(ScanBase):
    project_id: int


class ScanUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None


class ScanResponse(ScanBase):
    id: int
    project_id: int
    status: str
    progress: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
