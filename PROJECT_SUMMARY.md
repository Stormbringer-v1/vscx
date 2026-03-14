# vscx — Project Summary

> Internal documentation for the vscx vulnerability management platform.

---

## What is vscx?

**vscx** is an open-source, enterprise-grade vulnerability management platform.
- Think Nessus/Rapid7/OpenVAS quality — free to self-host
- Modern React UI with dark theme
- Built with Python FastAPI backend

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Celery, Redis, PostgreSQL |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Scanners | Nmap, Nuclei, Trivy |
| AI | Multi-provider: OpenAI, Anthropic, Ollama (local) |
| Infra | Docker Compose |

---

## Project Structure

```
vscx/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/      # API endpoints (routes)
│   │   ├── models/   # SQLAlchemy models
│   │   ├── services/ # Business logic
│   │   └── tasks/    # Celery tasks (scanners)
│   └── docker/
├── frontend/         # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context (auth, projects)
│   │   └── lib/         # API client, utilities
│   └── public/
├── docker/           # Docker Compose configs
├── docs/             # Documentation
└── stitch-screens/   # Google Stitch UI designs (PNG)
```

---

## What's DONE ✅

### Backend
- [x] PostgreSQL database with SQLAlchemy models
- [x] User authentication (register, login, JWT)
- [x] Project CRUD operations
- [x] Asset management (CRUD)
- [x] Scan configuration and execution
- [x] Scanner integrations:
  - [x] Nmap (network discovery)
  - [x] Nuclei (web vulnerability scanning)
  - [x] Trivy (container/image scanning)
- [x] CVE data integrations:
  - [x] NVD (National Vulnerability Database)
  - [x] OSV (Open Source Vulnerabilities)
  - [x] EPSS (Exploit Prediction Scoring System)
- [x] AI remediation suggestions (OpenAI/Anthropic/Ollama)
- [x] Celery task queue setup

### Frontend
- [x] React + TypeScript + Tailwind setup
- [x] Authentication pages (Login, Register)
- [x] Dashboard with security metrics
- [x] Asset management UI
- [x] Findings/vulnerabilities UI
- [x] Scan management UI
- [x] Settings page
- [x] Sidebar navigation

### Infrastructure
- [x] Docker Compose setup for backend services
- [x] PostgreSQL container
- [x] Redis container
- [x] Celery worker configuration

---

## What's NOT DONE ❌

### Critical
- [ ] **UI Theme** — Frontend still uses old design, NOT the Stitch dark theme
- [ ] PDF report generation
- [ ] Email notifications
- [ ] Webhooks

### Nice to Have
- [ ] SAML/OAuth SSO
- [ ] Multi-user teams
- [ ] Real-time WebSocket updates
- [ ] Scan scheduling (cron)
- [ ] Export to CSV/JSON

---

## Current Issue: UI Not Updated

**Problem:** The frontend code has NOT been updated with the Google Stitch designs.

**What exists:**
- `/stitch-screens/` contains 6 PNG screenshots of the dark theme design
- Design uses: dark background (`#0a0a0a` or similar), green accent (`#22c55e`)

**What needs to happen:**
1. Update each page component to match the Stitch design screenshots
2. Apply dark theme CSS consistently
3. Use the green accent color for buttons, highlights, etc.

**Pages to update:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Assets.tsx`
- `frontend/src/pages/Findings.tsx`
- `frontend/src/pages/Scans.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/components/Sidebar.tsx`

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL (via Docker)
- Redis (via Docker)

### Running Locally

```bash
# Backend
cd backend
cp .env.example .env
docker compose up -d

# Frontend
cd frontend
npm install
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## API Endpoints

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Projects
- `GET/POST /api/v1/projects`
- `DELETE /api/v1/projects/{id}`

### Assets
- `GET/POST /api/v1/projects/{id}/assets`
- `DELETE /api/v1/projects/{id}/assets/{id}`

### Scans
- `GET/POST /api/v1/projects/{id}/scans`
- `POST /api/v1/projects/{id}/scans/{id}/execute`
- `DELETE /api/v1/projects/{id}/scans/{id}`

### Findings
- `GET /api/v1/projects/{id}/findings`
- `PATCH /api/v1/projects/{id}/findings/{id}`

### CVE Data
- `GET /api/v1/cve/nvd/{cve_id}`
- `GET /api/v1/cve/osv/{cve_id}`
- `GET /api/v1/cve/epss/{cve_id}`

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | postgresql://postgres:postgres@localhost:5432/vscx |
| `REDIS_URL` | Redis connection | redis://localhost:6379/0 |
| `SECRET_KEY` | JWT secret | change-me |
| `AI_PROVIDER` | openai/anthropic/ollama | openai |
| `AI_API_KEY` | AI API key | - |

---

## Last Updated

2026-03-14

---

## Related Files

- `README.md` — Public project overview
- `PROJECT_PLAN.md` — Legacy task tracking (outdated)
- `VSCX.md` — Legacy agent instructions (outdated)
- `stitch-screens/` — UI design screenshots from Google Stitch
