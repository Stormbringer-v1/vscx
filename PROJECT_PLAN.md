# vscx — Project Plan

---

## Current Tasks

### Phase 1: Foundation
- [ ] Set up PostgreSQL database with migrations
- [ ] Implement user authentication (register, login, JWT)
- [ ] Create project CRUD endpoints
- [ ] Set up Redis and Celery
- [ ] Create basic frontend layout and routing

### Phase 2: Asset & Scan Management
- [ ] Asset CRUD endpoints
- [ ] Scan configuration and execution
- [ ] Scanner integrations (Nmap, Nuclei, Trivy)
- [ ] Frontend asset management UI
- [ ] Frontend scan creation UI

### Phase 3: Vulnerability Database
- [ ] NVD API integration
- [ ] OSV integration
- [ ] CVE lookup service
- [ ] EPSS score fetching

### Phase 4: AI Features
- [ ] AI remediation suggestions
- [ ] Report generation

---

## Getting Started

```bash
# Clone and setup
cp docker/.env.example docker/.env
docker compose up -d

# Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```
