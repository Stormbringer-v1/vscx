from fastapi import APIRouter

from app.api.v1.endpoints import auth, assets, scans, findings, projects, vulnerabilities

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(assets.router)
api_router.include_router(scans.router)
api_router.include_router(findings.router)
api_router.include_router(vulnerabilities.router)
