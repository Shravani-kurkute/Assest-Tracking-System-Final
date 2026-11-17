"""Helpers for department-aware user creation and employee code generation."""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.user import User


def generate_employee_code(db: Session, department: Department, created_at: datetime | None = None) -> str:
    timestamp = created_at or datetime.utcnow()
    month = timestamp.strftime("%b").lower()
    prefix = f"{department.code.upper()}_{month}"
    counter = 1

    while True:
        candidate = f"{prefix}{counter:02d}"
        exists = db.query(User).filter(User.employee_code == candidate).first()
        if not exists:
            return candidate
        counter += 1
