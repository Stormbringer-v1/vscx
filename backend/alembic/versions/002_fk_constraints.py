"""Add foreign key constraints

Revision ID: 002_fk_constraints
Revises: 001_initial
Create Date: 2026-03-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_fk_constraints'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_foreign_key('fk_projects_owner_id', 'projects', 'users', ['owner_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_assets_project_id', 'assets', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_scans_project_id', 'scans', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_scans_created_by', 'scans', 'users', ['created_by'], ['id'])
    op.create_foreign_key('fk_findings_scan_id', 'findings', 'scans', ['scan_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_findings_project_id', 'findings', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key('fk_findings_asset_id', 'findings', 'assets', ['asset_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_findings_asset_id', 'findings', type_='foreignkey')
    op.drop_constraint('fk_findings_project_id', 'findings', type_='foreignkey')
    op.drop_constraint('fk_findings_scan_id', 'findings', type_='foreignkey')
    op.drop_constraint('fk_scans_created_by', 'scans', type_='foreignkey')
    op.drop_constraint('fk_scans_project_id', 'scans', type_='foreignkey')
    op.drop_constraint('fk_assets_project_id', 'assets', type_='foreignkey')
    op.drop_constraint('fk_projects_owner_id', 'projects', type_='foreignkey')