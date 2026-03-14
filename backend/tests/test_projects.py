import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.base import User, Project, Asset, Scan


class TestProjectModel:
    @pytest.mark.asyncio
    async def test_create_project(self, db_session: AsyncSession, test_user: User):
        project = Project(
            name="Test Project",
            description="A test project for unit testing",
            owner_id=test_user.id
        )
        db_session.add(project)
        await db_session.commit()
        await db_session.refresh(project)

        result = await db_session.execute(select(Project).where(Project.name == "Test Project"))
        found_project = result.scalar_one_or_none()

        assert found_project is not None
        assert found_project.name == "Test Project"
        assert found_project.owner_id == test_user.id

    @pytest.mark.asyncio
    async def test_project_cascade_delete(self, db_session: AsyncSession, test_user: User):
        project = Project(
            name="Cascade Test",
            owner_id=test_user.id
        )
        db_session.add(project)
        await db_session.commit()
        await db_session.refresh(project)
        
        asset = Asset(
            project_id=project.id,
            name="Test Asset",
            asset_type="server"
        )
        db_session.add(asset)
        await db_session.commit()

        await db_session.delete(project)
        await db_session.commit()

        result = await db_session.execute(select(Asset).where(Asset.project_id == project.id))
        assert result.scalar_one_or_none() is None


class TestAssetModel:
    @pytest.mark.asyncio
    async def test_create_asset(self, db_session: AsyncSession, test_project: Project):
        asset = Asset(
            project_id=test_project.id,
            name="Web Server",
            asset_type="server",
            ip_address="10.0.0.1",
            hostname="webserver.local"
        )
        db_session.add(asset)
        await db_session.commit()
        await db_session.refresh(asset)

        result = await db_session.execute(select(Asset).where(Asset.name == "Web Server"))
        found_asset = result.scalar_one_or_none()

        assert found_asset is not None
        assert found_asset.ip_address == "10.0.0.1"
        assert found_asset.asset_type == "server"

    @pytest.mark.asyncio
    async def test_asset_query_by_project(self, db_session: AsyncSession, test_project: Project):
        assets = [
            Asset(project_id=test_project.id, name=f"Asset {i}", asset_type="server", ip_address=f"10.0.0.{i}")
            for i in range(3)
        ]
        for asset in assets:
            db_session.add(asset)
        await db_session.commit()

        result = await db_session.execute(select(Asset).where(Asset.project_id == test_project.id))
        project_assets = result.scalars().all()

        assert len(project_assets) == 3


class TestScanModel:
    @pytest.mark.asyncio
    async def test_create_scan(self, db_session: AsyncSession, test_project: Project, test_user: User):
        scan = Scan(
            project_id=test_project.id,
            name="Initial Scan",
            scan_type="nmap",
            targets="192.168.1.0/24",
            status="pending",
            created_by=test_user.id
        )
        db_session.add(scan)
        await db_session.commit()
        await db_session.refresh(scan)

        result = await db_session.execute(select(Scan).where(Scan.name == "Initial Scan"))
        found_scan = result.scalar_one_or_none()

        assert found_scan is not None
        assert found_scan.scan_type == "nmap"
        assert found_scan.status == "pending"

    @pytest.mark.asyncio
    async def test_scan_foreign_keys(self, db_session: AsyncSession, test_project: Project, test_user: User):
        scan = Scan(
            project_id=test_project.id,
            name="FK Test Scan",
            scan_type="nuclei",
            targets="example.com",
            status="pending",
            created_by=test_user.id
        )
        db_session.add(scan)
        await db_session.commit()

        assert scan.project_id == test_project.id
        assert scan.created_by == test_user.id