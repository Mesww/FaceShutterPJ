import enum
from pydantic import BaseModel
from typing import List

from sqlalchemy import JSON, Column, Integer, String, func, Enum
from backend.configs.db import Base
from sqlalchemy import Column, Integer, String, BLOB, DateTime

class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    USER = "USER"

class User(Base):
    """
    User model for face authentication
    """
    __tablename__ = 'users'

    users_id = Column(Integer, primary_key=True, index=True)  # Use 'users_id' as the primary key
    name = Column(String(60), unique=True, nullable=False)
    employee_id = Column(String(60), unique=True, nullable=False)
    roles = Column(Enum(RoleEnum), nullable=False)
    image_name = Column(String(100), nullable=False)
    create_at = Column(DateTime, unique=True, server_default=func.now(), nullable=False)
    update_at = Column(DateTime, onupdate=func.now(), nullable=True)
    def __repr__(self):
        return f"<User(users_id={self.users_id}, name='{self.name}')>"
    
class FaceEmbedding(BaseModel):
    user_id: str
    embedding: List[float]

    class Config:
        orm_mode = True