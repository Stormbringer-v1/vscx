from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AssetBase(BaseModel):
    name: str
    asset_type: str
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None


class AssetCreate(AssetBase):
    project_id: int


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_type: Optional[str] = None
    ip_address: Optional[str] = None
    hostname: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    risk_score: Optional[float] = None


class AssetResponse(AssetBase):
    id: int
    project_id: int
    risk_score: float
    last_scan_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
