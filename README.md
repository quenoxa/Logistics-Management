# LOGISTICS ONE

> **Enterprise Transportation & Logistics Management Platform**

LOGISTICS ONE is a production-grade, single-repository full-stack logistics and fleet operations platform built with **React 18**, **TypeScript**, **Tailwind CSS**, **Express.js**, and **SQLite (via Prisma ORM)**.

---

## 🏗️ Architecture & Single Full-Stack Structure

The application is organized as a unified full-stack codebase where the frontend React SPA and Express REST API backend coexist cleanly:

```
Logistics-management/
│
├── src/
│   ├── components/          # Reusable UI components (MetricCard, DataTable, Modal, StatusBadge, Header, Sidebar)
│   │   ├── common/
│   │   └── map/             # Interactive Leaflet corridor map
│   ├── pages/               # React application pages (Dashboard, Deliveries, Vehicles, Drivers, Orders, etc.)
│   ├── layouts/             # Page layouts
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API client service layer (Axios with Bearer JWT interceptors)
│   ├── utils/               # Shared frontend utility functions
│   ├── assets/              # Static assets and icons
│   ├── types/               # TypeScript interfaces matching backend models
│   ├── context/             # React AuthContext (session management)
│   │
│   ├── server/              # Backend Express API
│   │   ├── routes/          # REST route controllers (auth, vehicles, drivers, orders, deliveries, tracking, reports, settings, admin)
│   │   ├── controllers/     # Business logic handlers
│   │   ├── models/          # Data access models
│   │   ├── middleware/      # JWT authentication and RBAC authorization middleware
│   │   ├── services/        # Backend services
│   │   ├── utils/           # Backend utilities & helpers
│   │   ├── server.ts        # Express server entry point (Port 5000)
│   │   ├── test-suite.ts    # 19-point automated backend test suite
│   │   ├── audit-runner.ts  # 43-point full-stack integration audit suite
│   │   └── smoke-test-runner.ts # 4-phase end-to-end user smoke test runner
│   │
│   ├── App.tsx              # Protected layout router & role-based landing redirect
│   ├── main.tsx             # React DOM entry point
│   └── index.css            # Tailwind CSS directives
│
├── prisma/                  # Database schema & seeder
│   ├── schema.prisma        # Prisma data models and relations
│   ├── seed.ts              # Seeder with Indian logistics freight corridors
│   └── dev.db               # Persistent SQLite database file
│
├── public/                  # Public static assets
├── .env                     # Environment variables
├── .env.example             # Example environment template
├── .gitignore
├── index.html               # Main HTML entry point
├── package.json             # Unified single root package configuration
├── tsconfig.json            # Frontend TypeScript configuration
├── tsconfig.server.json     # Backend TypeScript configuration
├── tsconfig.node.json       # Vite configuration TypeScript settings
├── vite.config.ts           # Vite bundler & API proxy configuration
├── tailwind.config.js       # Tailwind CSS design system
└── README.md
```

---

## ⚡ Quick Start

### 1. Prerequisites
* **Node.js**: `v18.0+` or `v20.0+`
* **npm**: `v9.0+`

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Benedict-Edwin/Logistics-management.git
cd Logistics-management

# Install unified dependencies
npm install
```

### 3. Initialize & Seed Database
```bash
# Push Prisma schema to SQLite
npm run db:push

# Populate initial Indian logistics corridors and accounts
npm run db:seed
```

### 4. Start Full-Stack Application (Concurrent)
```bash
# Starts both Express API (:5000) and Vite React Frontend (:5173)
npm run dev
```

* **Frontend URL**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000/api`
* **API Healthcheck**: `http://localhost:5000/api/health`

---

## 👥 Demo User Accounts & Roles

| Role | Email | Password | Landing Page | Access Scope |
|---|---|---|---|---|
| **Administrator** | `admin@fleetops.io` | `admin123` | `/` (Operations) | Full system administration, user accounts, security audit logs, depot parameters |
| **Dispatcher** | `dispatcher@fleetops.io` | `dispatch123` | `/` (Operations) | Freight order booking, fleet dispatch, route radar, driver matching |
| **Fleet Operations Manager** | `ops@fleetops.io` | `ops123` | `/fleet-dashboard` | Vehicle inventory, workshop maintenance records, driver credentials & availability |
| **Commercial Driver** | `driver@fleetops.io` | `driver123` | `/driver-console` | Mobile-ready Driver Console, milestone progression, digital Proof of Delivery (POD) |

---

## 🛡️ Core Capabilities & Workflows

1. **Transactional Dispatch & Anti-Double-Booking**:
   * Automatic validation against vehicle payload capacity (`order.weightKg <= vehicle.maxPayloadKg`).
   * Prevents assigning drivers or vehicles that are already en route on active shipments (**HTTP 409 Conflict**).
   * Rejects vehicles flagged with `MAINTENANCE` status.

2. **Sequential 6-Step Delivery Lifecycle**:
   * `DISPATCHED` &rarr; `PICKED_UP` &rarr; `IN_TRANSIT` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED` (with signature capture) or `DELAYED`.
   * Real timestamped milestone events recorded in `DeliveryTimelineEvent` table.

3. **Real-time SQL Aggregations**:
   * Operations Dashboard KPIs, 7-day delivery volume trends, SLA on-time percentage, and driver leaderboards calculated dynamically from SQLite.

4. **Role-Based Security**:
   * Strict backend authorization (`requireRole` middleware) blocking unauthorized role access with **HTTP 403 Forbidden**.

---

## 🧪 Automated Testing

```bash
# Run 19-point backend verification suite
npm run test:suite

# Run 43-point full integration audit suite
npm run test:audit

# Run 4-phase end-to-end user smoke test runner
npm run test:smoke

# Compile & verify production build
npm run build
```

---

## 📦 Production Build

```bash
npm run build
```

This compiles TypeScript and outputs an optimized production build to the `dist/` directory.

---

## 📄 License
MIT License. Created by Benedict Edwin.
