"""Pydantic schemas for department creation and summary responses."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.user import UserSummary


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    created_at: datetime
    manager: Optional[UserSummary] = None
    employees_count: int = 0

    model_config = {"from_attributes": True}


class DepartmentDetailResponse(DepartmentResponse):
    employees: list[UserSummary] = []
