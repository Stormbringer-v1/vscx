# vscx

Enterprise-grade vulnerability management platform. Free. Forever.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-AGPL-green)
![Status](https://img.shields.io/badge/status-In%20Development-yellow)

## Overview

vscx is an open-source vulnerability management platform that combines powerful scanning capabilities with a modern, user-friendly interface. Built for security teams of all sizes.

## Features

- 🔍 **Network Scanning** - Nmap-powered discovery and CVE correlation
- 🌐 **Web App Scanning** - Nuclei templates for vulnerability detection
- ☁️ **Container Security** - Trivy scanning for Docker images
- 📊 **Smart Prioritization** - CVSS + EPSS scoring
- 🤖 **AI Remediation** - Plain-English fix guidance (OpenAI, Anthropic, Ollama)
- 📄 **Executive Reports** - PDF/HTML reports
- 🏠 **Self-Hostable** - Docker Compose deployment

## Screenshots

### Login
![Login](docs/images/login.png)

### Dashboard
![Dashboard](docs/images/dashboard.png)

### Assets
![Assets](docs/images/assets.png)

### Findings
![Findings](docs/images/findings.png)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, Celery, PostgreSQL, Redis |
| Frontend | React 18, TypeScript, Tailwind CSS |
| Scanning | Nmap, Nuclei, Trivy |
| AI | OpenAI, Anthropic, Ollama |
| Infra | Docker, Docker Compose |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- PostgreSQL (included)
- Redis (included)
- Node.js 18+ (for local development)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Stormbringer-v1/vscx.git
cd vscx

# Start backend (API + Workers)
cd backend
cp .env.example .env
# Edit .env with your settings
docker compose up -d

# Start frontend
cd ../frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production with Docker Compose

```bash
# From project root
docker compose -f docker/docker-compose.yml up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/vscx |
| `REDIS_URL` | Redis connection string | redis://localhost:6379/0 |
| `SECRET_KEY` | JWT secret key | change-me-in-production |
| `AI_PROVIDER` | AI provider (openai/anthropic/ollama) | openai |
| `AI_API_KEY` | API key for AI provider | - |

## Project Structure

```
vscx/
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── api/     # API endpoints
│   │   ├── models/  # SQLAlchemy models
│   │   ├── services/# Business logic
│   │   └── tasks/   # Celery tasks
│   └── tests/
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── lib/
│   │   └── context/
│   └── public/
├── docs/            # Documentation
└── docker/          # Docker configs
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `DELETE /api/v1/projects/{id}` - Delete project

### Assets
- `GET /api/v1/projects/{id}/assets` - List assets
- `POST /api/v1/projects/{id}/assets` - Add asset
- `DELETE /api/v1/projects/{id}/assets/{id}` - Delete asset

### Scans
- `GET /api/v1/projects/{id}/scans` - List scans
- `POST /api/v1/projects/{id}/scans` - Create scan
- `POST /api/v1/projects/{id}/scans/{id}/execute` - Run scan
- `DELETE /api/v1/projects/{id}/scans/{id}` - Delete scan

### Findings
- `GET /api/v1/projects/{id}/findings` - List findings
- `PATCH /api/v1/projects/{id}/findings/{id}` - Update finding status

### CVE Data
- `GET /api/v1/cve/nvd/{cve_id}` - Get NVD CVE details
- `GET /api/v1/cve/osv/{cve_id}` - Get OSV CVE details
- `GET /api/v1/cve/epss/{cve_id}` - Get EPSS score

## Development Status

| Feature | Status |
|---------|--------|
| User Authentication | ✅ Complete |
| Project Management | ✅ Complete |
| Asset Management | ✅ Complete |
| Nmap Scanner | ✅ Complete |
| Nuclei Scanner | ✅ Complete |
| Trivy Scanner | ✅ Complete |
| NVD Integration | ✅ Complete |
| OSV Integration | ✅ Complete |
| EPSS Integration | ✅ Complete |
| AI Remediation | ✅ Complete |
| Modern UI | ✅ Complete |
| PDF Reports | 🔄 Planned |
| Email Notifications | 🔄 Planned |
| Webhooks | 🔄 Planned |
| SAML/OAuth SSO | 🔄 Planned |

## License

AGPL v3 - See LICENSE file

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.

---

Built with ❤️ for the security community
