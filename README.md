# Smart Mess Queue & Food Waste Optimization Platform

A full-stack web application to help students and mess administrators manage meal queues, bookings, demand, and food waste in college dining halls.

## Technology Stack

| Layer          | Technology                                                         |
| -------------- | ------------------------------------------------------------------ |
| **Frontend**   | React 19, TypeScript, Vite, Tailwind CSS                           |
| **Backend**    | Node.js, Express.js, TypeScript                                    |
| **Database**   | PostgreSQL 16, Prisma ORM                                          |
| **Real-time**  | Socket.IO                                                          |
| **Auth**       | JWT (access + HTTP-only refresh token)                             |
| **Validation** | Zod                                                                |
| **Testing**    | Vitest + React Testing Library (client), Jest + Supertest (server) |

## Prerequisites

- **Node.js** ≥ 20 (tested on v24)
- **npm** ≥ 10
- **PostgreSQL** 16+ (via Docker or local install)
- **Docker** & **Docker Compose** (optional, for PostgreSQL)

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd Smart-Mess-Queue

# Install all dependencies (root + client + server + shared)
npm run setup
```

## Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your values (defaults work for local development)
```

### Environment Variables

| Variable               | Default                                                        | Description                       |
| ---------------------- | -------------------------------------------------------------- | --------------------------------- |
| `DATABASE_URL`         | `postgresql://postgres:postgres@localhost:5432/smart_mess_dev` | PostgreSQL connection string      |
| `JWT_ACCESS_SECRET`    | —                                                              | Secret for signing access tokens  |
| `JWT_REFRESH_SECRET`   | —                                                              | Secret for signing refresh tokens |
| `ACCESS_TOKEN_EXPIRY`  | `15m`                                                          | Access token lifetime             |
| `REFRESH_TOKEN_EXPIRY` | `7d`                                                           | Refresh token lifetime            |
| `SERVER_PORT`          | `3000`                                                         | Backend server port               |
| `CLIENT_URL`           | `http://localhost:5173`                                        | Frontend URL (for CORS)           |
| `NODE_ENV`             | `development`                                                  | Environment mode                  |
| `BCRYPT_ROUNDS`        | `12`                                                           | bcrypt hash rounds                |

## PostgreSQL Setup

### Option A: Docker (recommended)

```bash
# Start PostgreSQL container
docker compose up -d

# Verify it's running
docker compose ps
```

### Option B: Local PostgreSQL

1. Install PostgreSQL 16+
2. Create the database:
   ```sql
   CREATE DATABASE smart_mess_dev;
   ```
3. Update `DATABASE_URL` in `.env` if using different credentials.

## Prisma Setup

```bash
# Generate the Prisma client
cd server
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Open Prisma Studio to browse data
npx prisma studio
```

Or use the root shortcuts:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Running the Application

### Backend

```bash
# From root
npm run dev:server

# Or from server/
cd server
npm run dev
```

The server starts at `http://localhost:3000`. Verify with:

```
GET http://localhost:3000/api/health
```

### Frontend

```bash
# From root
npm run dev:client

# Or from client/
cd client
npm run dev
```

The client starts at `http://localhost:5173`. API requests are proxied to the backend.

### Both (in separate terminals)

```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev:client
```

## Running Tests

```bash
# All tests
npm test

# Client tests only
npm run test:client

# Server tests only
npm run test:server

# Watch mode (client)
cd client && npm run test:watch

# Watch mode (server)
cd server && npm run test:watch
```

## Linting & Formatting

```bash
# Lint all
npm run lint

# Format all files
npm run format

# Check formatting (CI)
npm run format:check
```

## Project Structure

```
Smart-Mess-Queue/
├── client/                      # React frontend
│   ├── src/
│   │   ├── api/                 # API client modules
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React Context providers
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Layout wrappers
│   │   ├── pages/               # Route-level page components
│   │   ├── router/              # React Router configuration
│   │   ├── services/            # Non-API services (Socket.IO, etc.)
│   │   ├── types/               # Frontend-specific TypeScript types
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles (Tailwind)
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # Environment, CORS, constants
│   │   ├── controllers/         # Route handlers
│   │   ├── errors/              # Custom error classes
│   │   ├── lib/                 # Prisma client singleton
│   │   ├── middleware/          # Express middleware
│   │   ├── repositories/       # Data access layer
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # Business logic
│   │   ├── sockets/             # Socket.IO handlers
│   │   ├── types/               # TypeScript type augmentations
│   │   ├── utils/               # Utilities (API response helpers)
│   │   ├── validators/          # Zod request validators
│   │   ├── app.ts               # Express app setup
│   │   └── server.ts            # HTTP server entry point
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.ts              # Seed data script
│   └── package.json
│
├── shared/                      # Shared code (types, constants, validators)
│   └── src/
│       ├── types/               # Enums, interfaces, API types
│       ├── constants/           # Shared constants
│       ├── validators/          # Shared Zod schemas
│       └── index.ts
│
├── docker-compose.yml           # PostgreSQL container
├── .env.example                 # Environment template
├── .prettierrc                  # Prettier configuration
├── .gitignore
├── package.json                 # Root scripts
└── README.md
```

## Core Domain Modules

The platform implements 6 core domain modules following a strict layered architecture (`routes → controllers → services → repositories → Prisma`):

1. **Authentication & RBAC (`/api/auth`)**:
   - Roles: `STUDENT` and `MESS_ADMIN`.
   - Short-lived JWT access tokens (15m) and secure, HTTP-only refresh tokens (7d).
   - Refresh token rotation with automatic replay attack detection (reused tokens revoke all user sessions).
   - Bcrypt password hashing (12 rounds) with constant-time dummy hashing against timing attacks.

2. **Mess & Menu Management (`/api/messes`, `/api/menus`, `/api/menu-items`, `/api/meal-configs`)**:
   - Dining hall capacity configuration and reusable dish catalogs.
   - Configurable meal service windows (Breakfast, Lunch, Dinner) with custom slot durations and cutoff times.
   - Menu publishing with automatic time slot generation based on meal configs.

3. **Student Booking Flow (`/api/bookings`)**:
   - Conflict-free meal booking with cutoff deadlines.
   - **Atomic concurrency protection**: Slots use database-level atomic increments (`UPDATE time_slots SET currentBookings = currentBookings + 1 WHERE id = $1 AND currentBookings < capacity`) to guarantee zero overbooking under high concurrency.
   - Idempotent rebooking and transactional cancellation capacity recovery.

4. **Check-in & Live Queue (`/api/queue`)**:
   - 15-minute pre-slot check-in window validation.
   - Sequential, monotonic ticketing per meal service.
   - State machine: `CHECKED_IN` → `WAITING` → `SERVING` → `SERVED` (or `NO_SHOW`).
   - Real-time updates broadcast via Socket.IO strictly _after_ database transactions commit.
   - Admin walk-in entry management without creating fake user accounts.

5. **Food Waste Tracking & Analytics (`/api/food-logs`)**:
   - Strict mathematical invariants enforced on backend:
     - `preparedKg >= 0`, `servedKg >= 0`, `wastedKg >= 0`
     - `servedKg + wastedKg <= preparedKg`
     - Derived `remainingKg = preparedKg - servedKg - wastedKg`
     - Derived `wastePercentage = (wastedKg / preparedKg) * 100` (safe zero handling)
   - Historical tracking by date, meal type, menu, and dining hall.

6. **Student Feedback & Operational Metrics (`/api/feedback`)**:
   - Service verification: Only legitimate completed meals (`SERVED` status with completed timestamp) can receive feedback.
   - Rejection of in-progress, cancelled, no-show, or future meals/slots.
   - Integer rating (1–5) and comment validation (max 500 characters).
   - Strict multi-mess tenant isolation for all admin analytics and queries.
   - High-performance batch operational metrics eliminating N+1 database queries.

---

## Production Deployment Guide

### 1. Build Artifacts

```bash
# Build frontend client (outputs to client/dist)
npm run build:client

# Compile backend TypeScript (outputs to server/dist)
npm run build:server
```

### 2. Production Database Migration

In production, run Prisma migration deployment to apply schema migrations without invoking development resets:

```bash
cd server
npx prisma migrate deploy
```

### 3. Production Environment Checklist

Ensure the production environment defines:

- `NODE_ENV=production`
- `DATABASE_URL` pointing to production PostgreSQL with SSL (`?sslmode=require`).
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` set to distinct, cryptographically random 256-bit keys (`openssl rand -base64 48`).
- `CLIENT_URL` pointing to the public HTTPS domain of the frontend for CORS and Cookie scoping.
- `SERVER_PORT` set to your application port (e.g. `3000`).

### 4. Reverse Proxy & WebSocket Configuration (Nginx)

When deploying behind Nginx or an Application Load Balancer, ensure WebSocket upgrade headers are passed for Socket.IO:

```nginx
server {
    listen 443 ssl http2;
    server_name mess.university.edu;

    # Frontend static files
    location / {
        root /var/www/smart-mess-queue/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Real-time WebSockets
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Available Scripts

### Root

| Script                 | Description                                   |
| ---------------------- | --------------------------------------------- |
| `npm run setup`        | Install all dependencies across all packages  |
| `npm run dev:client`   | Start frontend development server             |
| `npm run dev:server`   | Start backend development server              |
| `npm run build:client` | Build frontend for production (`client/dist`) |
| `npm run build:server` | Compile backend TypeScript (`server/dist`)    |
| `npm run lint`         | Lint client + server codebases                |
| `npm run format`       | Format all files with Prettier                |
| `npm test`             | Run complete server and client test suites    |
| `npm run db:migrate`   | Run Prisma development migrations             |
| `npm run db:generate`  | Generate Prisma client                        |
| `npm run db:seed`      | Seed the database                             |
| `npm run db:studio`    | Open Prisma Studio database viewer            |
| `npm run db:reset`     | Reset database (drop + migrate + seed)        |

---

## License

ISC
