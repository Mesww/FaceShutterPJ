from pathlib import Path
from dotenv import load_dotenv, dotenv_values
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import databases

# Load environment variables
pathenv = Path('./.env')
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()

# Database URL
DATABASE_URL = config.get('DATABASEURL', "mysql+asyncmy://root:root@192.168.187.130:3306/faceshutter")

# Async database instance
database = databases.Database(DATABASE_URL)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=True,
    future=True
)

# Base for declarative models
Base = declarative_base()

# Async session factory
AsyncSessionLocal = sessionmaker(
    engine, 
    class_=AsyncSession,
    expire_on_commit=False
)

# Dependency for getting async database session
async def get_async_db():
    """
    Async database session dependency
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()