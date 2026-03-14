# vscx

Enterprise-grade vulnerability management. Free. Forever.

## Overview

vscx is an open-source vulnerability management platform that combines powerful scanning capabilities with a modern, user-friendly interface. Built for security teams of all sizes.

## Features

- 🔍 **Network Scanning** - Nmap-powered discovery and CVE correlation
- 🌐 **Web App Scanning** - Nuclei templates + custom DAST engine  
- ☁️ **Cloud Security** - AWS, GCP, Azure misconfiguration detection
- 🤖 **AI Remediation** - Plain-English fix guidance
- 📊 **Smart Prioritization** - CVSS + EPSS + CISA KEV scoring
- 📄 **Executive Reports** - PDF/HTML reports
- 🏠 **Self-Hostable** - Docker Compose deployment

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.12, FastAPI, Celery, PostgreSQL, Redis |
| Frontend | React, TypeScript, Tailwind CSS |
| Scanning | Nmap, Nuclei, Trivy |
| AI | Multi-provider (OpenAI, Anthropic, Ollama) |
| Infra | Docker, Docker Compose |

## Quick Start

```bash
# Clone the repo
git clone https://github.com/yourusername/vscx.git
cd vscx

# Start with Docker Compose
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up -d

# Open in browser
open http://localhost:3000
```

## Documentation

See the `docs/` directory for detailed architecture and API documentation.

## License

AGPL v3 - See LICENSE file

## Contributing

Contributions welcome! See CONTRIBUTING.md for details.
