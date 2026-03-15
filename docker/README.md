# Docker Installation (Alternative)

If you prefer Docker over native installation:

## Quick Start

1. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

2. Run the stack:
   ```bash
   docker-compose up -d
   ```

3. Check logs for admin credentials:
   ```bash
   docker-compose logs backend | grep -A5 "Initial Admin"
   ```

4. Access the application at `http://localhost:3000`

## Services

- **Frontend**: Port 3000
- **Backend**: Port 8000
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://vscx:vscx@postgres:5432/vscx` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379/0` |
| `CELERY_BROKER_URL` | Celery broker URL | `redis://redis:6379/1` |
| `SECRET_KEY` | Secret key for JWT | (required) |
| `ALLOW_PRIVATE_TARGETS` | Allow scanning private networks | `true` |

## Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# View celery worker logs
docker-compose logs -f celery

# Rebuild containers
docker-compose build
```

## First Login

The admin credentials are generated randomly on first boot. Check the backend logs:

```bash
docker-compose logs backend | grep -A5 "Initial Admin"
```

You will be prompted to change your password on first login.
