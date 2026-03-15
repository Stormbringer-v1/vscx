# VSCX — Vulnerability Scanner

Open-source vulnerability management platform. Scan your infrastructure, discover vulnerabilities, get AI-powered remediation suggestions.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-AGPL-green)

## Features

- Network scanning (Nmap), web vulnerability scanning (Nuclei), container scanning (Trivy)
- AI-powered remediation suggestions (OpenAI, Anthropic, Ollama)
- CVE enrichment from NVD, OSV, EPSS databases
- Dark-themed modern web UI
- Scan profiles: Quick, Standard, Aggressive, Container
- Asset discovery and tracking
- First-login password change
- Audit logging

## Quick Start

### Option 1: Install Script (Recommended for Ubuntu/Debian)

```bash
git clone https://github.com/your-repo/vscx.git
cd vscx
sudo bash install.sh
```

The script will:
- Install PostgreSQL, Redis, Nginx, Python 3.12
- Install Nmap, Nuclei, Trivy scanners
- Set up the application with systemd services
- Configure Nginx reverse proxy
- Print admin credentials on first boot

Check admin credentials:
```bash
journalctl -u vscx-backend --no-pager | grep -A5 "Initial Admin"
```

### Option 2: Docker

See [docker/README.md](docker/README.md)

```bash
cd docker
docker-compose up -d
```

Check logs for admin credentials:
```bash
docker-compose logs backend | grep -A5 "Initial Admin"
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | postgresql+asyncpg://vscx:vscx@postgres:5432/vscx |
| `REDIS_URL` | Redis connection string | redis://redis:6379/0 |
| `CELERY_BROKER_URL` | Celery broker URL | redis://redis:6379/1 |
| `SECRET_KEY` | JWT secret key | (required) |
| `ALLOW_PRIVATE_TARGETS` | Allow scanning private networks (10.x, 172.16.x, 192.168.x) | true |
| `NVD_API_KEY` | NVD API key for faster CVE lookups | - |
| `OPENAI_API_KEY` | OpenAI API key for AI remediation | - |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI remediation | - |
| `OLLAMA_BASE_URL` | Ollama server URL | http://localhost:11434 |

## Architecture

- **Backend**: FastAPI + PostgreSQL + Redis + Celery
- **Frontend**: React + TypeScript + Tailwind CSS
- **Scanning**: Nmap, Nuclei, Trivy

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
├── docker/          # Docker configs
└── install.sh      # Native installation script
```

## Development

```bash
# Backend tests
cd backend && python -m pytest tests/ -v

# Frontend type check
cd frontend && npx tsc --noEmit

# Check celery worker logs for scan issues
docker-compose logs --tail=50 celery
```

## License

AGPL v3 — See LICENSE file
