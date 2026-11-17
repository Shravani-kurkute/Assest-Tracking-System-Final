"""Pydantic schemas for user records and authentication payloads."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: UserRole = UserRole.employee
    department: Optional[str] = None
    employee_id: Optional[str] = None
    employee_code: Optional[str] = None
    department_id: Optional[int] = None


class UserCreate(UserBase):
    employee_id: str
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSummary(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    department: Optional[str] = None
    department_id: Optional[int] = None
    employee_id: Optional[str] = None
    employee_code: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ManagerCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    department_id: int


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class ManagerAssignment(BaseModel):
    manager_id: int
    department_id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None
