# Pyramid — Task Management System

Full-stack task management app built for the AbleSpace Full Stack Developer technical assessment.

- **Frontend:** Next.js (App Router) + Tailwind CSS + shadcn/ui — `frontend/`
- **Backend:** NestJS + Prisma + PostgreSQL — `backend/`
- **Auth:** Google OAuth 2.0 + Guest login, JWT (httpOnly cookies) with refresh rotation

> Full setup, architecture, environment-variable and deployment docs are being written alongside the build — see the sections below as they land.

## Quick start (local)

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend && npm install && npx prisma migrate dev && npm run seed && npm run start:dev

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev
```
