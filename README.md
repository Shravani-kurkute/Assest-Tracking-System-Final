# Industrial Asset Lifecycle Management and Tracking System

## Overview

A web-based system for registering, assigning, tracking, maintaining, and reporting on industrial assets throughout their lifecycle. The current codebase provides a FastAPI REST backend, a React frontend, JWT authentication with role-based access, asset and department management, assignment and request workflows, maintenance tracking, in-app notifications, reports, and QR-based asset identification.

The QR workflow uses the existing asset identifier (for example, `AST-0001`) as the QR payload. Scanning a printed or displayed QR decodes that identifier, calls the backend lookup endpoint, and displays the matching asset record.

## Key Features

- JWT login and role-based access for `system_admin`, `dept_admin`, `employee`, and `management`.
- Asset registration, editing, deletion, search, filtering, and paginated listing.
- Asset assignment and assignment history; employees can return their own assigned assets.
- Reassignment is performed by updating the asset's `assigned_to` field.
- Asset requests with approve/reject workflow and in-app notifications.
- QR code generation, SVG download, print view, and camera scanning with manual ID fallback.
- QR lookup that retrieves the matching MySQL/ORM asset record by `asset_id`.
- Maintenance request reporting and status updates.
- Department and department-user management.
- Role-aware dashboard with statistics and recent activity; a demo-data fallback is available when the API returns no records.
- Report summary and generated PDF download.
- In-app notification inbox with mark-as-read and read-all actions.
- Health endpoints for application and database status.

## QR Code Workflow

1. Create or register an asset.
2. Open **Assets** and choose **View QR** for that asset.
3. The QR is generated from the asset's normalized identifier, e.g. `AST-0001`.
4. Download the SVG or use the print view to produce a physical label.
5. Open **Scan QR** from the navigation or the Assets page.
6. Allow camera access in the browser.
7. Point the camera at the physical or displayed QR code.
8. The scanner decodes the asset identifier.
9. The frontend calls `GET /api/v1/assets/lookup?code=AST-0001`.
10. The backend retrieves the corresponding asset record.
11. The matching asset information is displayed inline on the scan page.

A **View Asset Details** link is available after a successful scan and opens the Assets list. Manual entry is available if camera scanning is not possible. Camera scanning requires a secure context (HTTPS or localhost).

## Technology Stack

### Frontend

- React 19.2.4
- React Router 7.13.2
- Vite 8.0.3
- Tailwind CSS 3.4.1
- Axios 1.13.6
- lucide-react 1.7.0
- react-hot-toast 2.6.0
- `qrcode.react` 4.2.0 for QR generation
- `html5-qrcode` 2.3.8 for camera-based QR scanning

### Backend

- Python 3.10+ (Render configuration uses 3.11.9)
- FastAPI 0.115.0
- Uvicorn 0.29.0
- SQLAlchemy 2.0.36
- PyMySQL 1.1.1
- Psycopg 3.2.10 for optional PostgreSQL deployments
- Pydantic 2.10.6 / pydantic-settings 2.6.1
- python-jose 3.3.0 and passlib[bcrypt] 1.7.4 for JWT and password hashing

### Database

- MySQL is the intended relational database.
- The current configuration also supports PostgreSQL and falls back to SQLite when database variables are not configured.
- `database/schema.sql` contains the MySQL table definitions for the current models.

### API and Tools

- REST API documented by FastAPI at `/docs` and `/redoc`
- Git and GitHub
- Render and Vercel configuration files are included for deployment

## System Architecture

```text
React frontend (Vite)
        |
        | HTTP + Bearer token
        v
FastAPI REST API (/api/v1)
        |
        | SQLAlchemy ORM
        v
MySQL database (or configured fallback)
```

QR identification follows the same API path:

```text
Asset QR -> Browser camera -> html5-qrcode decode -> asset identifier
         -> GET /assets/lookup?code=... -> database record -> displayed details
```

## Project Structure

```text
asset-tracking-system/
├── README.md
├── .env.example
├── .gitignore
├── render.yaml
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   └── diagrams/
├── backend/
│   ├── .env.example
│   ├── README.md
│   ├── requirements.txt
│   ├── run.py
│   ├── seed_users.py
│   ├── reset_admin.py
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── api/v1/
│       ├── core/
│       ├── models/
│       └── schemas/
└── frontend/
    ├── .env.example
    ├── README.md
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── vercel.json
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── utils/
```

## Prerequisites

- Python 3.10 or newer
- Node.js `^20.19.0 || >=22.12.0` and npm
- MySQL 8+ if using the documented database setup
- Git
- Optional: a hosted PostgreSQL database if using `DATABASE_URL` with the installed Psycopg driver

## Installation

### Backend

From the project root:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate
```

```powershell
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create the backend environment file:

```bash
cp .env.example .env
```

Then edit `backend/.env` and replace the placeholder `SECRET_KEY` and database values. Do not commit this file.

### Frontend

From the project root:

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
cp .env.example .env
```

The example value points to the local backend:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Database Setup

1. Create the MySQL schema:

```bash
mysql -u root -p < database/schema.sql
```

2. Configure `backend/.env` with either a single URL:

```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/asset_tracking_db
```

Or individual fields:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=user
DB_PASSWORD=password
DB_NAME=asset_tracking_db
```

3. Optional: load safe demo departments and assets:

```bash
mysql -u root -p asset_tracking_db < database/seed.sql
```

4. Seed demo users:

```bash
cd backend
python seed_users.py
```

5. Start the backend. On first startup, SQLAlchemy also creates missing tables from the ORM models and applies small column/index checks.

If MySQL variables are omitted, the backend falls back to `sqlite:///./asset_tracking.db` for local development.

## Environment Variables

The application reads `backend/.env` and `frontend/.env`; the root `.env.example` is a combined reference. Copy the relevant example file and replace all placeholders.

### Backend

| Variable | Purpose |
|---|---|
| `APP_NAME` | Application display name |
| `APP_VERSION` | Application version |
| `DEBUG` | Enables SQLAlchemy echo when true |
| `SECRET_KEY` | JWT signing key; replace with a long random value |
| `DATABASE_URL` | Full SQLAlchemy database URL; takes precedence over `DB_*` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Individual MySQL connection fields |
| `JWT_ALGORITHM` | JWT signing algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime |
| `FRONTEND_URL` | Primary frontend origin for CORS |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL |

## Running the Application

### Backend

```bash
cd backend
python run.py
```

Runs at `http://localhost:8000`.

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Application health: `http://localhost:8000/health`
- API health: `http://localhost:8000/api/v1/health`

### Frontend

```bash
cd frontend
npm run dev
```

Runs at `http://localhost:5173`.

Other commands:

```bash
npm run lint
npm run build
npm run preview
```

## QR Code Testing

1. Start the backend and frontend.
2. Log in with a seeded account.
3. Open **Assets**.
4. Select **View QR** for an existing asset.
5. Download the SVG or display the QR on another screen.
6. Open **Scan QR**.
7. Allow camera access.
8. Point the camera at the QR code.
9. Verify the decoded asset ID is shown.
10. Verify the backend lookup returns the correct asset and its details are displayed.

The QR may be scanned from a printed label or a second phone. Camera access requires HTTPS or localhost. If scanning is unavailable, enter the asset ID in the manual lookup field. In development mode, a small decoded-value panel is shown for verification.

## API Overview

All endpoints below are prefixed with `/api/v1` unless noted.

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Users | `GET /users`, `POST /users/create-manager`, `POST /users/create-employee`, `PUT /users/assign-manager` |
| Departments | `POST /departments`, `GET /departments`, `GET /departments/{department_id}` |
| Assets | `POST /assets`, `GET /assets`, `GET /assets/lookup?code=...`, `PUT /assets/{asset_id}`, `DELETE /assets/{asset_id}` |
| Assignments | `POST /assign`, `GET /assignments` |
| Asset requests | `POST /requests`, `GET /requests`, `GET /requests/assets`, `PUT /requests/{request_id}/approve`, `PUT /requests/{request_id}/reject` |
| Maintenance | `POST /maintenance`, `GET /maintenance`, `PUT /maintenance/{id}/status` |
| Notifications | `GET /notifications`, `PUT /notifications/{id}/read`, `PUT /notifications/read-all`, `POST /notifications/system-alerts` |
| Reports | `GET /reports/summary`, `GET /reports/pdf` |
| Health | `GET /api/v1/health` and top-level `GET /health` |

Full interactive documentation is available at `/docs`.

## Database

The current application uses seven ORM tables:

| Table | Purpose |
|---|---|
| `departments` | Department records and codes |
| `users` | User accounts, roles, department links, and password hashes |
| `assets` | Asset identifier, name, category, status, assignee, and purchase/return dates |
| `assignments` | Assignment history with assigned and return dates |
| `asset_requests` | Asset requests and approval state |
| `maintenance_requests` | Maintenance issues and status |
| `notifications` | In-app notifications |

`database/schema.sql` defines these tables for MySQL with matching keys, indexes, and enum values. `database/seed.sql` contains only non-sensitive sample departments and assets.

## Project Workflow

```text
User
  -> Authentication
  -> Dashboard
  -> Asset Management
  -> Assignment / Reassignment
  -> Asset Requests and Approvals
  -> Maintenance
  -> QR Identification
  -> Notifications
  -> Reports and Tracking
```

Access is filtered by role and, for several workflows, by the user's department or assigned assets.

## Troubleshooting

- **MySQL connection problems**: confirm MySQL is running and that `DATABASE_URL` or the `DB_*` values in `backend/.env` are correct.
- **Backend not running**: start it with `cd backend && python run.py`; check `http://localhost:8000/docs`.
- **Frontend cannot reach API**: verify `VITE_API_URL` in `frontend/.env` and check browser console/network errors.
- **CORS errors**: ensure `FRONTEND_URL` and `CORS_ORIGINS` include the exact frontend origin.
- **Camera permission denied**: allow camera access in browser settings and reload the page.
- **QR scanner not detecting**: use good lighting, keep the QR inside the brackets, try a larger printed code, and confirm the page is on HTTPS or localhost.
- **Invalid asset ID**: QR payloads must match the `AST-####` format or be entered manually in that format.
- **Asset not found**: the decoded ID is valid but no matching record exists; confirm the asset was created and the backend uses the intended database.
- **401 after login**: the access token may have expired; log in again.

## Future Scope

- Add formal asset transfer history separate from assignment updates.
- Add automated tests and CI checks.
- Add password reset and email notifications.
- Replace startup schema checks with managed migrations.
- Provide a mobile application for faster field scanning.

