from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.utils.logger import get_logger
from app.config import settings


logger = get_logger("database")

# Database connection
db_url = settings.DB_URL

if not db_url:
    logger.error("DATABASE_URL is not set. Please check your .env file.")
else:
    logger.info("Database URL successfully loaded.")

engine = create_engine(db_url)
session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = session_local()
    try:
        yield db
    finally:
        db.close()
