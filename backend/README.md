# Backend - Industrial Asset Lifecycle Management and Tracking System

FastAPI backend providing authentication, asset management, assignments, requests, maintenance, departments, notifications, reports, and QR lookup.

## Requirements

- Python 3.10+
- FastAPI and dependencies from `requirements.txt`
- MySQL 8+ for the documented database setup; SQLite fallback is available locally

## Setup

From `backend/`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Replace `SECRET_KEY` and configure either `DATABASE_URL` or the `DB_*` values in `backend/.env`. Do not commit `.env`.

For MySQL, create the schema from the repository root:

```bash
mysql -u root -p < database/schema.sql
```

Optional non-sensitive demo data:

```bash
mysql -u root -p asset_tracking_db < database/seed.sql
```

## Run API

```bash
python run.py
```

The API runs at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health` and `/api/v1/health`

## Seed Users

```bash
python seed_users.py
```

Use the demo accounts created by the script and change the seeded password before any deployment.

## Utility Scripts

- `python seed_users.py` creates or updates demo users.
- `python reset_admin.py` resets the demo admin password.

## Notes

- All API routes are mounted under `/api/v1`.
- The QR scanner calls `GET /assets/lookup?code=AST-0001`.
- Tables are created by SQLAlchemy on startup; `database/schema.sql` is the clean MySQL setup file.
