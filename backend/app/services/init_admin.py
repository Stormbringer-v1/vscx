import secrets
import string
from sqlalchemy import select
from app.models.base import User
from app.core.security import get_password_hash

def generate_password(length=16):
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

async def init_admin_user(db):
    """Create admin user on first boot if no users exist."""
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none() is not None:
        return

    password = generate_password()
    admin = User(
        username="admin",
        email="admin@vscx.local",
        hashed_password=get_password_hash(password),
        is_active=True,
        is_superuser=True,
        must_change_password=True,
    )
    db.add(admin)
    await db.commit()

    print("=" * 60)
    print("  VSCX Initial Admin Credentials")
    print("=" * 60)
    print(f"  Username: admin")
    print(f"  Password: {password}")
    print("=" * 60)
    print("  Change this password after first login!")
    print("=" * 60)
