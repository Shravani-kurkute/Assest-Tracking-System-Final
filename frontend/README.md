# Frontend - Industrial Asset Lifecycle Management and Tracking System

React + Vite client for asset management, QR generation/scanning, assignments, requests, maintenance, departments, notifications, and reports.

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- npm

## Setup

From `frontend/`:

```bash
npm install
cp .env.example .env
```

Set `VITE_API_URL` to the backend API base URL. The default local value is:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

## Run in Development

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Other Commands

```bash
npm run lint
npm run build
npm run preview
```

## QR Features

- Generate an asset QR from the Assets page.
- Download the SVG or print the QR label.
- Open Scan QR and allow camera access.
- The QR contains the asset identifier, e.g. `AST-0001`.
- Scanning decodes the ID, calls the backend lookup API, and displays the asset details.
- Manual ID entry is available as a fallback.
- Camera scanning requires HTTPS or localhost.

## Authentication Notes

- Access token, refresh token, and user profile are stored in local storage.
- On API `401`, local storage is cleared and the user is redirected to `/login`.
