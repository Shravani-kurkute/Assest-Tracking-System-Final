"""Department management endpoints for system administrators."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import require_system_admin
from app.database import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.department import (
    DepartmentCreate,
    DepartmentDetailResponse,
    DepartmentResponse,
)

router = APIRouter(prefix="/departments", tags=["Departments"])


def _build_department_summary(db: Session, department: Department) -> DepartmentResponse:
    manager = (
        db.query(User)
        .filter(
            User.department_id == department.id,
            User.role == UserRole.dept_admin,
        )
        .order_by(User.created_at.asc(), User.id.asc())
        .first()
    )
    employees_count = (
        db.query(User)
        .filter(
            User.department_id == department.id,
            User.role == UserRole.employee,
        )
        .count()
    )

    return DepartmentResponse(
        id=department.id,
        name=department.name,
        code=department.code,
        description=department.description,
        created_at=department.created_at,
        manager=manager,
        employees_count=employees_count,
    )


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    normalized_name = payload.name.strip()
    normalized_code = payload.code.strip().upper()

    if db.query(Department).filter(Department.name == normalized_name).first():
        raise HTTPException(status_code=400, detail="Department name already exists")

    if db.query(Department).filter(Department.code == normalized_code).first():
        raise HTTPException(status_code=400, detail="Department code already exists")

    department = Department(
        name=normalized_name,
        code=normalized_code,
        description=payload.description.strip() if payload.description else None,
    )
    db.add(department)
    db.commit()
    db.refresh(department)

    return _build_department_summary(db, department)


@router.get("", response_model=list[DepartmentResponse])
def list_departments(
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    departments = db.query(Department).order_by(Department.name.asc()).all()
    return [_build_department_summary(db, department) for department in departments]


@router.get("/{department_id}", response_model=DepartmentDetailResponse)
def get_department(
    department_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    department = (
        db.query(Department)
        .options(joinedload(Department.users))
        .filter(Department.id == department_id)
        .first()
    )
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    manager = next(
        (user for user in department.users if user.role == UserRole.dept_admin),
        None,
    )
    employees = [
        user
        for user in sorted(department.users, key=lambda current: current.full_name.lower())
        if user.role == UserRole.employee
    ]

    return DepartmentDetailResponse(
        id=department.id,
        name=department.name,
        code=department.code,
        description=department.description,
        created_at=department.created_at,
        manager=manager,
        employees_count=len(employees),
        employees=employees,
    )
