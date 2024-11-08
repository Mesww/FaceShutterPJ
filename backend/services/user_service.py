import json
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.user_model import User
from sqlalchemy.future import select
from fastapi import HTTPException

class UserService:
    
    @staticmethod
    async def register_user(
        db: AsyncSession,
        name: str,
        email: str,
        employee_id: str
    ) -> Tuple[Optional[User], str]:
        try:
            # ตรวจสอบว่าอีเมลหรือรหัสพนักงานนี้มีผู้ใช้แล้ว
            stmt = select(User).filter(User.email == email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
            if existing_user:
                return None, "Email already registered"
            
            # สร้างผู้ใช้ใหม่
            new_user = User(
                name=name,
                email=email,
                employee_id=employee_id
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user, "User registered successfully"
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    @staticmethod
    async def delete_user(
        db: AsyncSession,
        user_id: str
    ) -> Tuple[bool, str]:
        try:
            stmt = select(User).filter(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user is None:
                return False, "User not found"
            
            await db.delete(user)
            await db.commit()
            return True, "User deleted successfully"
        except Exception as e:
            await db.rollback()
            return False, f"Failed to delete user: {str(e)}"

    @staticmethod
    async def get_user(
        db: AsyncSession,
        user_id: str
    ) -> Optional[User]:
        try:
            stmt = select(User).filter(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            return user
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch user: {str(e)}")

    @staticmethod
    async def update_user(
        db: AsyncSession,
        user_id: str,
        name: str,
        email: str
    ) -> Tuple[Optional[User], str]:
        try:
            # ตรวจสอบว่าผู้ใช้มีอยู่ในระบบหรือไม่
            stmt = select(User).filter(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user is None:
                return None, "User not found"
            
            # อัปเดตข้อมูลของผู้ใช้
            user.name = name
            user.email = email
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            return user, "User updated successfully"
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail=f"Update failed: {str(e)}")
