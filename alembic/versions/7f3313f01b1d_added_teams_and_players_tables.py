"""Added Teams and Players tables

Revision ID: 7f3313f01b1d
Revises: 4b8f90ef95bc
Create Date: 2025-03-07 16:34:30.470256

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f3313f01b1d"
down_revision: Union[str, None] = "4b8f90ef95bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.create_table(
        "teams",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("name", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("nationality", sa.String()),
        sa.Column("logo_url", sa.String()),
        sa.Column("points", sa.Integer(), default=0),
        sa.Column("players", sa.JSON(), default=[]),
    )
    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("name", sa.String(), nullable=False, index=True),
        sa.Column("team", sa.Integer(), sa.ForeignKey("teams.id"), index=True),
        sa.Column("stats", sa.JSON(), default={}),
    )


def downgrade():
    op.drop_table("players")
    op.drop_table("teams")
