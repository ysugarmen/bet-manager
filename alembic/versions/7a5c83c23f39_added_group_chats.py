"""Added group chats

Revision ID: 7a5c83c23f39
Revises: f6fae560567d
Create Date: 2025-03-01 12:35:51.688711

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "7a5c83c23f39"
down_revision: Union[str, None] = "f6fae560567d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index("ix_posts_id", table_name="posts")
    op.drop_table("posts")
    op.add_column(
        "betting_leagues", sa.Column("chat_messages", sa.JSON(), nullable=True)
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("betting_leagues", "chat_messages")
    op.create_table(
        "posts",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("content", sa.TEXT(), autoincrement=False, nullable=False),
        sa.Column(
            "created_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.Column("user_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.Column("league_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(
            ["league_id"], ["betting_leagues.id"], name="posts_league_id_fkey"
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="posts_user_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="posts_pkey"),
    )
    op.create_index("ix_posts_id", "posts", ["id"], unique=False)
    # ### end Alembic commands ###
