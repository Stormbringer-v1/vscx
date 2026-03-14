# vscx — Mission Control
> Every agent reads this file first. No exceptions.

---

## What is vscx?

An open source, enterprise-grade vulnerability management platform.
Think Nessus / Rapid7 / OpenVAS quality — free to self-host, modern UI.

---

## Environments

| Location | Path | Access | Role |
|---|---|---|---|
| Local (Mac) | `/Users/robertharutyunyan/Documents/antigravity/vscx` | Direct | Code Editing & Coordination |
| Linux VM | TBD | TBD | Execution, Building & Testing |

> **RULE:** No execution occurs on the local machine unless explicitly stated.

---

## Tech Stack

- **Backend:** Python 3.12, FastAPI, SQLAlchemy (async), Celery, Redis, PostgreSQL
- **Frontend:** React + TypeScript + Tailwind CSS
- **Scanners:** Nmap, Nuclei, Trivy
- **AI:** Multi-provider (OpenAI, Anthropic, local Ollama)
- **Infrastructure:** Docker Compose

---

## Current Status: Phase 1 — Foundation

- [ ] Backend API & Database Schema
- [ ] Frontend Scaffolding
- [ ] Auth System
- [ ] Scanner Integrations
- [ ] Vulnerability Database Sync

---

## Key Files

| File | Purpose |
|---|---|
| README.md | Project overview |
| PROJECT_PLAN.md | Active task tracking |
