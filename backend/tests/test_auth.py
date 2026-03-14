import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_password_hash, verify_password
from app.models.base import User
from app.schemas.user import UserRegister


class TestPasswordHashing:
    def test_get_password_hash(self):
        password = "TestPass123"
        hashed = get_password_hash(password)
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        password = "TestPass123"
        hashed = get_password_hash(password)
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        password = "TestPass123"
        wrong_password = "WrongPass456"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False


class TestUserRegistrationValidation:
    def test_valid_username(self):
        user = UserRegister(username="validuser", email="test@example.com", password="TestPass123")
        assert user.username == "validuser"

    def test_username_too_short(self):
        with pytest.raises(ValueError, match="between 3 and 32"):
            UserRegister(username="ab", email="test@example.com", password="TestPass123")

    def test_username_too_long(self):
        with pytest.raises(ValueError, match="between 3 and 32"):
            UserRegister(username="a" * 33, email="test@example.com", password="TestPass123")

    def test_username_invalid_chars(self):
        with pytest.raises(ValueError, match="letters, numbers, and underscores"):
            UserRegister(username="user@name", email="test@example.com", password="TestPass123")

    def test_password_too_short(self):
        with pytest.raises(ValueError, match="at least 8"):
            UserRegister(username="validuser", email="test@example.com", password="Short1")

    def test_password_no_uppercase(self):
        with pytest.raises(ValueError, match="uppercase"):
            UserRegister(username="validuser", email="test@example.com", password="lowercase1")

    def test_password_no_lowercase(self):
        with pytest.raises(ValueError, match="lowercase"):
            UserRegister(username="validuser", email="test@example.com", password="UPPERCASE1")

    def test_password_no_digit(self):
        with pytest.raises(ValueError, match="digit"):
            UserRegister(username="validuser", email="test@example.com", password="NoDigits")

    def test_valid_email(self):
        user = UserRegister(username="validuser", email="test@example.com", password="TestPass123")
        assert user.email == "test@example.com"

    def test_invalid_email(self):
        with pytest.raises(ValueError):
            UserRegister(username="validuser", email="not-an-email", password="TestPass123")


class TestUserModel:
    @pytest.mark.asyncio
    async def test_create_user(self, db_session: AsyncSession):
        user = User(
            username="newuser",
            email="new@example.com",
            hashed_password=get_password_hash("Password123"),
            is_active=True
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        result = await db_session.execute(select(User).where(User.username == "newuser"))
        found_user = result.scalar_one_or_none()
        
        assert found_user is not None
        assert found_user.username == "newuser"
        assert found_user.email == "new@example.com"
        assert found_user.is_active is True

    @pytest.mark.asyncio
    async def test_user_unique_constraints(self, db_session: AsyncSession):
        user1 = User(
            username="duplicate",
            email="first@example.com",
            hashed_password=get_password_hash("Password123"),
            is_active=True
        )
        db_session.add(user1)
        await db_session.commit()

        user2 = User(
            username="duplicate",
            email="second@example.com",
            hashed_password=get_password_hash("Password123"),
            is_active=True
        )
        db_session.add(user2)
        
        with pytest.raises(Exception):
            await db_session.commit()