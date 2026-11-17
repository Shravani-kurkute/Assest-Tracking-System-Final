"""Department-aware user management endpoints for managers and system admins."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    require_dept_admin_or_above,
    require_system_admin,
)
from app.core.organization import generate_employee_code
from app.core.security import hash_password
from app.database import get_db
from app.models.department import Department
from app.models.user import User, UserRole
from app.schemas.user import (
    EmployeeCreate,
    ManagerAssignment,
    ManagerCreate,
    UserResponse,
    UserSummary,
)

router = APIRouter(prefix="/users", tags=["Users"])


def _create_user_record(
    *,
    db: Session,
    full_name: str,
    email: str,
    password: str,
    role: UserRole,
    department: Department | None = None,
) -> User:
    normalized_email = email.strip().lower()
    normalized_name = full_name.strip()

    if db.query(User).filter(User.email == normalized_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    employee_code = None
    department_name = None
    department_id = None

    if department:
        employee_code = generate_employee_code(db, department)
        department_name = department.name
        department_id = department.id

    if role == UserRole.system_admin and not employee_code:
        admin_count = (
            db.query(User).filter(User.role == UserRole.system_admin).count() + 1
        )
        employee_code = f"SYS_{admin_count:02d}"

    user = User(
        employee_id=employee_code,
        employee_code=employee_code,
        full_name=normalized_name,
        email=normalized_email,
        hashed_password=hash_password(password),
        role=role,
        department=department_name,
        department_id=department_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserSummary])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_dept_admin_or_above),
):
    query = db.query(User)
    if current_user.role == UserRole.dept_admin:
        query = query.filter(User.department_id == current_user.department_id)
    return query.order_by(User.full_name.asc()).all()


@router.post("/create-manager", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_manager(
    payload: ManagerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    department = db.query(Department).filter(Department.id == payload.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    existing_manager = (
        db.query(User)
        .filter(
            User.department_id == department.id,
            User.role == UserRole.dept_admin,
        )
        .first()
    )
    if existing_manager:
        raise HTTPException(status_code=400, detail="Department already has a manager")

    return _create_user_record(
        db=db,
        full_name=payload.name,
        email=payload.email,
        password=payload.password,
        role=UserRole.dept_admin,
        department=department,
    )


@router.post("/create-employee", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_dept_admin_or_above),
):
    department_id = current_user.department_id
    if current_user.role == UserRole.system_admin:
        raise HTTPException(
            status_code=403,
            detail="Use a department manager account to create employees",
        )

    if not department_id:
        raise HTTPException(status_code=400, detail="Department admin has no department assigned")

    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    return _create_user_record(
        db=db,
        full_name=payload.name,
        email=payload.email,
        password=payload.password,
        role=UserRole.employee,
        department=department,
    )


@router.put("/assign-manager", response_model=UserResponse)
def assign_manager_to_department(
    payload: ManagerAssignment,
    db: Session = Depends(get_db),
    _: User = Depends(require_system_admin),
):
    department = db.query(Department).filter(Department.id == payload.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    manager = db.query(User).filter(User.id == payload.manager_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    if manager.role != UserRole.dept_admin:
        raise HTTPException(status_code=400, detail="Selected user is not a department manager")

    existing_manager = (
        db.query(User)
        .filter(
            User.department_id == department.id,
            User.role == UserRole.dept_admin,
            User.id != manager.id,
        )
        .first()
    )
    if existing_manager:
        raise HTTPException(status_code=400, detail="Department already has a manager")

    if not manager.employee_code:
        manager.employee_code = generate_employee_code(db, department)
        manager.employee_id = manager.employee_code

    manager.department_id = department.id
    manager.department = department.name
    db.commit()
    db.refresh(manager)
    return manager
