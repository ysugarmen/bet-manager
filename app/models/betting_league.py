from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    JSON,
    ForeignKey,
    Boolean,
    func,
    Text,
)
from sqlalchemy.orm import relationship, Session
from sqlalchemy.orm.attributes import flag_modified
from app.models import Base
import random, string


class BettingLeague(Base):
    __tablename__ = "betting_leagues"
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    members = Column(JSON, default=[])  # ✅ List of user IDs
    posts = Column(JSON, default=[])
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    public = Column(Boolean, default=False, nullable=False)
    code = Column(String(4), nullable=True, unique=True)  # ✅ 4-char league code
    group_picture = Column(String, nullable=True)  # ✅ URL to group picture
    chat_messages = Column(JSON, default=list)  # ✅ List of chat messages

    def __repr__(self):
        return f"<BettingLeague(name='{self.name}', manager_id='{self.manager_id}', code='{self.code}')>"

    def generate_code(self, db: Session):
        """Generates a unique 4-character random code with uppercase letters and numbers."""
        characters = string.ascii_uppercase + string.digits  # A-Z and 0-9
        while True:
            league_code = "".join(random.choices(characters, k=4))
            if (
                not db.query(BettingLeague)
                .filter(BettingLeague.code == league_code)
                .first()
            ):
                self.code = league_code
                break
