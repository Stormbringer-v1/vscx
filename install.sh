#!/bin/bash
set -e

echo "================================================"
echo "  VSCX Installation Script"
echo "================================================"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root or with sudo."
    exit 1
fi

echo "This script will install VSCX on your server."
echo ""
echo "It will install:"
echo "  - Python 3.12"
echo "  - PostgreSQL 16"
echo "  - Redis"
echo "  - Nginx"
echo "  - Nmap, Nuclei, Trivy (security scanners)"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

echo "Starting installation..."

echo ">>> Installing system dependencies..."
apt-get update
apt-get install -y \
    python3.12 python3.12-venv python3-pip \
    postgresql postgresql-contrib \
    redis-server \
    nginx \
    nmap \
    git curl wget unzip

echo ">>> Installing Nuclei..."
NUCLEI_VERSION=$(curl -sL https://api.github.com/repos/projectdiscovery/nuclei/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | tr -d 'v')
if [ -z "$NUCLEI_VERSION" ]; then
    NUCLEI_VERSION="3.1.0"
fi
cd /tmp
wget -q "https://github.com/projectdiscovery/nuclei/releases/download/v${NUCLEI_VERSION}/nuclei_${NUCLEI_VERSION}_linux_amd64.zip" -O nuclei.zip
unzip -o nuclei.zip
mv nuclei /usr/local/bin/
chmod +x /usr/local/bin/nuclei
rm nuclei.zip

echo ">>> Installing Trivy..."
TRIVY_VERSION=$(curl -sfL https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name"' | cut -d'"' -f4 | tr -d 'v')
if [ -z "$TRIVY_VERSION" ]; then
    TRIVY_VERSION="0.48.0"
fi
cd /tmp
wget -q "https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz" -O trivy.tar.gz
tar -xzf trivy.tar.gz
mv trivy /usr/local/bin/
chmod +x /usr/local/bin/trivy
rm trivy.tar.gz

echo ">>> Setting up PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 24)
su - postgres -c "psql -c \"CREATE USER vscx WITH PASSWORD '$POSTGRES_PASSWORD';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE DATABASE vscx OWNER vscx;\"" 2>/dev/null || true
su - postgres -c "psql -c \"ALTER USER vscx CREATEDB;\"" 2>/dev/null || true

DATABASE_URL="postgresql+asyncpg://vscx:${POSTGRES_PASSWORD}@localhost:5432/vscx"

echo ">>> Setting up Redis..."
systemctl enable redis-server
systemctl start redis-server

echo ">>> Creating system user..."
useradd -r -s /bin/false vscx 2>/dev/null || true

echo ">>> Setting up application..."
APP_DIR="/opt/vscx"
mkdir -p $APP_DIR
cp -r /root/vscx/* $APP_DIR/ 2>/dev/null || cp -r . $APP_DIR/
chown -R vscx:vscx $APP_DIR

cd $APP_DIR/backend
python3.12 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo ">>> Generating configuration..."
SECRET_KEY=$(openssl rand -hex 32)
cat > $APP_DIR/backend/.env << EOF
DATABASE_URL=$DATABASE_URL
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
SECRET_KEY=$SECRET_KEY
ALLOW_PRIVATE_TARGETS=true
EOF

chown vscx:vscx $APP_DIR/backend/.env

echo ">>> Running database migrations..."
cd $APP_DIR/backend
source venv/bin/activate
alembic upgrade head

echo ">>> Building frontend..."
cd $APP_DIR/frontend
npm ci
VITE_API_URL=/api/v1 npm run build

echo ">>> Creating systemd services..."
cat > /etc/systemd/system/vscx-backend.service << 'EOF'
[Unit]
Description=VSCX Backend
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=vscx
WorkingDirectory=/opt/vscx/backend
Environment="PATH=/opt/vscx/backend/venv/bin"
ExecStart=/opt/vscx/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/vscx-worker.service << 'EOF'
[Unit]
Description=VSCX Celery Worker
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=vscx
WorkingDirectory=/opt/vscx/backend
Environment="PATH=/opt/vscx/backend/venv/bin"
ExecStart=/opt/vscx/backend/venv/bin/celery -A app.services.celery_app worker -l info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

echo ">>> Configuring Nginx..."
cat > /etc/nginx/sites-available/vscx << 'EOF'
server {
    listen 80;
    server_name _;

    root /opt/vscx/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/vscx /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo ">>> Starting services..."
systemctl enable --now vscx-backend
systemctl enable --now vscx-worker
systemctl reload nginx

SERVER_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "================================================"
echo "  VSCX Installation Complete!"
echo "================================================"
echo ""
echo "  URL:      http://$SERVER_IP"
echo ""
echo "  Check backend logs for initial admin credentials:"
echo "    journalctl -u vscx-backend --no-pager -f | grep -A5 'Initial Admin'"
echo ""
echo "  Services:"
echo "    systemctl status vscx-backend"
echo "    systemctl status vscx-worker"
echo ""
echo "  Default ports:"
echo "    Backend: 8000"
echo "    Frontend: nginx (port 80)"
echo "================================================"
