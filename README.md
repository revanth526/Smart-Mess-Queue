# 🍽️ Smart Mess Queue & Food Waste Optimization Platform

A full-stack web application designed to modernize college dining operations through intelligent meal booking, real-time queue management, demand tracking, and food waste analytics.

The platform connects students and mess administrators through a centralized system that improves dining experiences, reduces waiting times, optimizes food preparation, and minimizes food wastage.

---

## ✨ Key Features

### 🔐 1. Authentication & Role-Based Access Control
- Secure JWT-based authentication.
- Separate access for Students and Mess Administrators.
- Short-lived access tokens and HTTP-only refresh tokens.
- Refresh token rotation and replay attack detection.
- Bcrypt password hashing with 12 rounds.
- Secure session and authentication management.

### 🍱 2. Mess & Menu Management
- Manage multiple dining halls (messes).
- Configure dining hall capacity.
- Create and manage reusable food item catalogs.
- Configure breakfast, lunch, and dinner schedules.
- Set meal timings, slot durations, and booking cutoff deadlines.
- Publish menus with automatically generated time slots.

### 📅 3. Smart Meal Booking
- Students can browse menus and book meal slots.
- Conflict-free booking with automatic cutoff validation.
- Real-time slot capacity management.
- Database-level atomic booking operations to prevent overbooking.
- Idempotent booking operations.
- Transaction-safe cancellation and capacity recovery.

### 🎟️ 4. Real-Time Queue Management
- Digital meal check-in system.
- Automatic sequential ticket generation.
- 15-minute pre-slot check-in validation.
- Live queue status updates using Socket.IO.
- Queue state management:
  - `CHECKED_IN`
  - `WAITING`
  - `SERVING`
  - `SERVED`
  - `NO_SHOW`
- Admin-managed walk-in entries.
- Real-time synchronization between students and administrators.

### ♻️ 5. Food Waste Tracking & Analytics
- Record prepared, served, and wasted food quantities.
- Automatic calculation of remaining food.
- Automatic waste percentage calculation.
- Historical waste tracking.
- Analytics by date, meal type, menu, and dining hall.
- Backend-enforced mathematical validation to maintain accurate records.

### ⭐ 6. Student Feedback & Operational Analytics
- Students can submit feedback after completing a meal.
- Integer-based ratings from 1 to 5.
- Optional comments with a 500-character limit.
- Feedback restricted to verified completed meals.
- Admin dashboards for operational insights.
- Optimized batch queries to reduce unnecessary database requests.
- Strict multi-mess data isolation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Backend | Node.js |
| API Framework | Express.js |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Real-Time Communication | Socket.IO |
| Authentication | JWT |
| Password Security | Bcrypt |
| Validation | Zod |
| Client Testing | Vitest, React Testing Library |
| Server Testing | Jest, Supertest |

---

## 🏗️ System Architecture

The application follows a modular, layered architecture that separates presentation, business logic, and data access.

```text
                  STUDENT / ADMIN
                         |
                         ▼
                REACT FRONTEND
                 React + Vite
                         |
                  REST API / Socket.IO
                         |
                         ▼
                EXPRESS BACKEND
                         |
                  ROUTES LAYER
                         |
                         ▼
               CONTROLLERS LAYER
                         |
                         ▼
                SERVICES LAYER
                         |
                         ▼
              REPOSITORIES LAYER
                         |
                         ▼
                  PRISMA ORM
                         |
                         ▼
                 POSTGRESQL DB
```

**Backend request flow:**

`Routes → Controllers → Services → Repositories → Prisma → PostgreSQL`

This architecture improves maintainability, scalability, testability, and separation of concerns.

---

## 📁 Project Structure

```text
Smart-Mess-Queue/
│
├── client/                         # React frontend
│   ├── src/
│   │   ├── api/                    # API client modules
│   │   ├── components/              # Reusable UI components
│   │   ├── context/                 # React context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── layouts/                 # Application layouts
│   │   ├── pages/                   # Application pages
│   │   ├── router/                  # Routing configuration
│   │   ├── services/                # Socket.IO and other services
│   │   ├── types/                   # Frontend TypeScript types
│   │   ├── utils/                   # Utility functions
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── config/                  # Environment and app config
│   │   ├── controllers/             # Request handlers
│   │   ├── errors/                  # Custom error classes
│   │   ├── lib/                     # Shared libraries
│   │   ├── middleware/              # Express middleware
│   │   ├── repositories/            # Database access layer
│   │   ├── routes/                  # API routes
│   │   ├── services/                # Business logic
│   │   ├── sockets/                 # Socket.IO handlers
│   │   ├── types/                   # Backend TypeScript types
│   │   ├── utils/                   # Helper functions
│   │   ├── validators/              # Zod validators
│   │   ├── app.ts                   # Express configuration
│   │   └── server.ts                # Server entry point
│   │
│   ├── prisma/
│   │   ├── schema.prisma            # Database schema
│   │   └── seed.ts                  # Seed data
│   │
│   └── package.json
│
├── shared/                          # Shared application code
│   └── src/
│       ├── types/
│       ├── constants/
│       ├── validators/
│       └── index.ts
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .prettierrc
├── package.json
└── README.md
```

---

## ⚙️ Prerequisites

Make sure the following software is installed:

- **Node.js:** 20 or higher (tested with v24)
- **npm:** 10 or higher
- **PostgreSQL:** 16 or higher
- **Docker & Docker Compose:** Optional, recommended for local database setup
- **Git:** For version control

---

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone <repo-url>
cd Smart-Mess-Queue
```

### 2. Install Dependencies

Install dependencies across the root, frontend, backend, and shared packages.

```bash
npm run setup
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration.

| Variable | Default / Description |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/smart_mess_dev` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `ACCESS_TOKEN_EXPIRY` | `15m` |
| `REFRESH_TOKEN_EXPIRY` | `7d` |
| `SERVER_PORT` | `3000` |
| `CLIENT_URL` | `http://localhost:5173` |
| `NODE_ENV` | `development` |
| `BCRYPT_ROUNDS` | `12` |

**Important:** Use strong, unique secrets for JWT authentication. Never commit your actual `.env` file to version control.

---

## 🐘 Database Setup

You can configure PostgreSQL using either Docker or a local PostgreSQL installation.

### Option A: Docker (Recommended)

Start the PostgreSQL container:

```bash
docker compose up -d
```

Check the container status:

```bash
docker compose ps
```

### Option B: Local PostgreSQL

1. Install PostgreSQL 16 or higher.
2. Open PostgreSQL or pgAdmin.
3. Create a database:

```sql
CREATE DATABASE smart_mess_dev;
```

4. Update `DATABASE_URL` in your `.env` file if necessary.

---

## 🗄️ Prisma Configuration

Generate the Prisma client:

```bash
npm run db:generate
```

Run database migrations:

```bash
npm run db:migrate
```

Seed the database (optional):

```bash
npm run db:seed
```

Open Prisma Studio:

```bash
npm run db:studio
```

Prisma Studio provides a graphical interface for viewing and managing database records.

---

## ▶️ Running the Application

The frontend and backend run independently during development.

### Start the Backend

From the project root:

```bash
npm run dev:server
```

Backend URL:

```text
http://localhost:3000
```

Health check:

```text
GET http://localhost:3000/api/health
```

### Start the Frontend

Open another terminal:

```bash
npm run dev:client
```

Frontend URL:

```text
http://localhost:5173
```

The Vite development server proxies API requests to the backend.

### Application URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| API Health Check | http://localhost:3000/api/health |
| Prisma Studio | http
