"""FastAPI application entrypoint and router registration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.config import settings
from app.database import Base, engine
from app.models import department as department_model  # registers model before create_all
from app.models import asset as asset_model  # registers model before create_all
from app.models import assignment as assignment_model  # registers model before create_all
from app.models import asset_request as asset_request_model  # registers model before create_all
from app.models import maintenance as maintenance_model  # registers model before create_all
from app.models import notification as notification_model  # registers model before create_all
from app.models import user as user_model  # registers model before create_all
from app.api.v1 import (
    assets,
    assignments,
    auth,
    departments,
    health,
    maintenance,
    notifications,
    reports,
    requests,
    users,
)

Base.metadata.create_all(bind=engine)


def ensure_asset_table_extensions():
    inspector = inspect(engine)
    if "assets" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("assets")}
    dialect = engine.dialect.name

    with engine.begin() as connection:
        if "asset_id" not in existing_columns:
            connection.execute(text("ALTER TABLE assets ADD COLUMN asset_id VARCHAR(20)"))
        if "description" not in existing_columns:
            connection.execute(text("ALTER TABLE assets ADD COLUMN description VARCHAR(500)"))

        rows = connection.execute(
            text("SELECT id, asset_id FROM assets ORDER BY id ASC")
        ).mappings().all()
        for row in rows:
            if not row["asset_id"]:
                connection.execute(
                    text("UPDATE assets SET asset_id = :asset_code WHERE id = :id"),
                    {"asset_code": f"AST-{row['id']:04d}", "id": row["id"]},
                )

        if dialect == "postgresql":
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_asset_id "
                    "ON assets (asset_id)"
                )
            )
        elif dialect == "mysql":
            existing_indexes = {
                index["name"] for index in inspector.get_indexes("assets")
            }
            if "uq_assets_asset_id" not in existing_indexes:
                connection.execute(
                    text("CREATE UNIQUE INDEX uq_assets_asset_id ON assets (asset_id)")
                )


ensure_asset_table_extensions()


def ensure_department_hierarchy_extensions():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    dialect = engine.dialect.name

    with engine.begin() as connection:
        if "employee_code" not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN employee_code VARCHAR(50)"))
        if "department_id" not in existing_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN department_id INTEGER"))

        if "departments" in inspector.get_table_names():
            department_rows = connection.execute(
                text("SELECT id, name, code FROM departments")
            ).mappings().all()
            department_map = {row["name"]: row["id"] for row in department_rows}

            user_rows = connection.execute(
                text(
                    "SELECT id, department, employee_id, employee_code "
                    "FROM users ORDER BY id ASC"
                )
            ).mappings().all()

            next_department_number = len(department_rows) + 1

            for row in user_rows:
                department_name = (row["department"] or "").strip()
                if department_name and department_name not in department_map:
                    code = "".join(part[0] for part in department_name.split() if part)[:2].upper()
                    if not code:
                        code = f"DP{next_department_number:02d}"
                    base_code = code
                    suffix = 1
                    while connection.execute(
                        text("SELECT 1 FROM departments WHERE code = :code"),
                        {"code": code},
                    ).first():
                        code = f"{base_code}{suffix}"
                        suffix += 1
                    connection.execute(
                        text(
                            "INSERT INTO departments (name, code, description) "
                            "VALUES (:name, :code, :description)"
                        ),
                        {
                            "name": department_name,
                            "code": code,
                            "description": f"Auto-created from existing users in {department_name}",
                        },
                    )
                    department_id = connection.execute(
                        text("SELECT id FROM departments WHERE name = :name"),
                        {"name": department_name},
                    ).scalar()
                    department_map[department_name] = department_id
                    next_department_number += 1

                if department_name and row["id"] and department_map.get(department_name):
                    connection.execute(
                        text(
                            "UPDATE users SET department_id = :department_id "
                            "WHERE id = :id AND (department_id IS NULL OR department_id = 0)"
                        ),
                        {"department_id": department_map[department_name], "id": row["id"]},
                    )

                if not row["employee_code"]:
                    fallback_code = row["employee_id"] or f"USR_{row['id']:02d}"
                    connection.execute(
                        text(
                            "UPDATE users SET employee_code = :employee_code "
                            "WHERE id = :id"
                        ),
                        {"employee_code": fallback_code, "id": row["id"]},
                    )

        if dialect == "postgresql":
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_employee_code "
                    "ON users (employee_code)"
                )
            )
        elif dialect == "mysql":
            existing_indexes = {index["name"] for index in inspector.get_indexes("users")}
            if "uq_users_employee_code" not in existing_indexes:
                connection.execute(
                    text("CREATE UNIQUE INDEX uq_users_employee_code ON users (employee_code)")
                )


ensure_department_hierarchy_extensions()

app = FastAPI(
    title="Asset Tracking System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(departments.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(requests.router, prefix="/api/v1")
app.include_router(maintenance.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "Asset Tracking System"}
