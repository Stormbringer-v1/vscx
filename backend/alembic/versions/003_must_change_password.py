"""Add must_change_password to users

Revision ID: 003_must_change_password
Revises: 002_fk_constraints
Create Date: 2026-03-15

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '003_must_change_password'
down_revision: Union[str, None] = '002_fk_constraints'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('must_change_password', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('users', 'must_change_password')
