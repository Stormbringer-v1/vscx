import pytest
import pytest_asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.security import get_password_hash, verify_password
from app.models.base import User, Project, Asset, Scan, Finding


TEST_DATABASE_URL = "sqlite+aiosqlite:///test.db"


@pytest_asyncio.fixture
async def engine():
    if os.path.exists("test.db"):
        os.remove("test.db")
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()
    if os.path.exists("test.db"):
        os.remove("test.db")


@pytest_asyncio.fixture
async def db_session(engine):
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("TestPass123"),
        is_active=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_project(db_session: AsyncSession, test_user: User):
    project = Project(
        name="Test Project",
        description="A test project",
        owner_id=test_user.id
    )
    db_session.add(project)
    await db_session.commit()
    await db_session.refresh(project)
    return project


@pytest_asyncio.fixture
async def test_asset(db_session: AsyncSession, test_project: Project):
    asset = Asset(
        project_id=test_project.id,
        name="Test Server",
        asset_type="server",
        ip_address="192.168.1.100",
        hostname="testserver.local"
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset