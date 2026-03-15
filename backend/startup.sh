#!/bin/bash
set -e

echo "Waiting for database to be ready..."
for i in {1..30}; do
    if PGPASSWORD=vscx psql -h postgres -U vscx -d vscx -c '\q' 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    echo "Waiting for database... ($i/30)"
    sleep 2
done

echo "Running database migrations..."
cd /app
alembic upgrade head || true

# Create default admin user if not exists
PGPASSWORD=vscx psql -h postgres -U vscx -d vscx -c "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, hashed_password VARCHAR(255) NOT NULL, is_active BOOLEAN DEFAULT true, is_superuser BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());" 2>/dev/null || true
PGPASSWORD=vscx psql -h postgres -U vscx -d vscx -c "INSERT INTO users (username, email, hashed_password, is_active, is_superuser) SELECT 'admin', 'admin@vscx.local', '\$2b\$12\$24nkl3ebANZ8U5MQIhmtc.m4A8qJipZdYBrWFhuzZY4ANaPpmWMCa', true, true WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');" 2>/dev/null || true

echo "Starting the application..."
exec "$@"
