# Smart Mess Queue & Food Waste Optimization Platform

A full-stack web application to help students and mess administrators manage meal queues, bookings, demand, and food waste in college dining halls.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Real-time** | Socket.IO |
| **Auth** | JWT (access + HTTP-only refresh token) |
| **Validation** | Zod |
| **Testing** | Vitest + React Testing Library (client), Jest + Supertest (server) |

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

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/smart_mess_dev` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | — | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | — | Secret for signing refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token lifetime |
| `SERVER_PORT` | `3000` | Backend server port |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (for CORS) |
| `NODE_ENV` | `development` | Environment mode |
| `BCRYPT_ROUNDS` | `12` | bcrypt hash rounds |

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

## Available Scripts

### Root

| Script | Description |
|--------|-------------|
| `npm run setup` | Install all dependencies |
| `npm run dev:client` | Start frontend dev server |
| `npm run dev:server` | Start backend dev server |
| `npm run build:client` | Build frontend for production |
| `npm run build:server` | Compile backend TypeScript |
| `npm run lint` | Lint client + server |
| `npm run format` | Format all files with Prettier |
| `npm test` | Run all tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database (drop + migrate + seed) |

## License

ISC
