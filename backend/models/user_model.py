import enum
from pydantic import BaseModel
from typing import List
from datetime import datetime  # ใช้ datetime แทน DateTime ของ SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Enum, func
from sqlalchemy.orm import relationship
from backend.configs.db import Base

class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    USER = "USER"

class User(Base):
    """
    User model for authentication and user data
    """
    __tablename__ = 'users'

    users_id = Column(Integer, primary_key=True, index=True)  # Use 'users_id' as the primary key
    name = Column(String(60), unique=True, nullable=False)
    email = Column(String(60), nullable=True)
    employee_id = Column(String(60), unique=True, nullable=False)
    tel = Column(String(10), nullable=True)
    roles = Column(Enum(RoleEnum), nullable=False)
    image_name = Column(String(100), nullable=False)
    create_at = Column(DateTime, unique=True, server_default=func.now(), nullable=False)
    update_at = Column(DateTime, onupdate=func.now(), nullable=True)

    __table_args__ = {'extend_existing': True}  # เพิ่มบรรทัดนี้เพื่อป้องกันข้อผิดพลาดจากการประกาศซ้ำ

    def __repr__(self):
        return f"<User(users_id={self.users_id}, name='{self.name}')>"

# Pydantic Models
class UserBase(BaseModel):
    name: str
    employee_id: str
    email:str
    roles: RoleEnum
    create_at: datetime  # เปลี่ยนเป็น datetime แทน SQLAlchemy DateTime
    tel: str
    class Config:
        from_attributes = True  # ใช้ from_attributes แทน orm_mode ใน Pydantic V2

class UserCreate(UserBase):
    image_name: str

class UserUpdate(UserBase):
    image_name: str

class UserInDB(UserBase):
    users_id: int
    create_at: datetime  # ใช้ datetime แทน DateTime ของ SQLAlchemy
    update_at: datetime  # ใช้ datetime แทน DateTime ของ SQLAlchemy

class FaceEmbedding(BaseModel):
    user_id: str
    embedding: List[float]

    class Config:
        from_attributes = True  # ใช้ from_attributes แทน orm_mode ใน Pydantic V2
