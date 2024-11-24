import enum
from typing import Optional, List  # Import List
from pydantic import BaseModel, Field
from datetime import datetime

class RoleEnum(enum.Enum):
    ADMIN = "ADMIN"
    STAFF = "STAFF"
    USER = "USER"

class Faceimage(BaseModel):  # Move Faceimage class before User class
    """
    Faceimage model for face image data
    """
    direction: str
    path: str
    feature: Optional[List[float]] = []  # Add feature field with empty list


class User(BaseModel):
    """
    User model for authentication and user data
    """
    name: Optional[str] =None
    email: Optional[str] =None
    employee_id: str
    tel: Optional[str] =None
    images: Optional[List[Faceimage]] = []  # Add faceimage field with empty list
    roles: Optional[RoleEnum] = RoleEnum.USER  # Default to USER role
    create_at: datetime = Field(default_factory=datetime.now)  # Default to current time
    update_at: Optional[datetime] = None
    
class Userupdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    faceimage: Optional[List[Faceimage]] = None
    roles: Optional[RoleEnum] = RoleEnum.USER 
    update_at: Optional[datetime] = Field(default_factory=datetime.now)  # Default to current time