# Docker Deployment Plan

## Services
- **db**: PostgreSQL 16 (Alpine) — port 5432
- **backend**: Node.js 18 + Express — port 5000
- **frontend**: Next.js 14 — port 3000

## Quick Start
```bash
# Build and start all services
docker compose up --build -d

# Check logs
docker compose logs -f

# Stop everything
docker compose down

# Stop and delete volumes (destroys DB data)
docker compose down -v
```

## Environment Variables
| Service | Variable | Value |
|---------|----------|-------|
| backend | DATABASE_URL | postgresql://postgres:postgres@db:5432/student_db |
| frontend | NEXT_PUBLIC_API_URL | http://backend:5000 |

## Notes
- Frontend proxies `/api/*` to the backend service
- Backend waits for PostgreSQL health check before starting
- Database data persists in a named volume `pgdata`
