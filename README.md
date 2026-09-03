# LOGISTIX — Enterprise Logistics & Fleet Management Operations Platform

![Build Status](https://img.shields.io/badge/Build-Passing%20(0%20errors)-emerald?style=for-the-badge&logo=vite)
![Audit Suite](https://img.shields.io/badge/Audit%20Suite-48%2F48%20Passed%20(100%25)-emerald?style=for-the-badge&logo=jest)
![Database](https://img.shields.io/badge/Database-MongoDB%20Atlas%20(Cloud)-green?style=for-the-badge&logo=mongodb)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20Serverless-black?style=for-the-badge&logo=vercel)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)

**LOGISTIX** is a mission-critical, enterprise-grade logistics, freight operations, and fleet management platform. Designed with a high-density, midnight-navy visual system and inspired by modern logistics platforms like Samsara and Flexport, it provides complete visibility across freight booking, driver and vehicle assignments, live GPS telemetry, digital proof-of-delivery (POD) signature capture, preventative maintenance tracking, and automated reporting.

---

## 🏛️ System Architecture

LOGISTIX is structured as a unified full-stack TypeScript repository:

```
Logistics-management/
├── api/                           # Vercel Serverless Function Handlers
│   ├── index.ts                   # Root Serverless API handler
│   └── [...all].ts                # Wildcard catch-all Serverless API handler
│
├── src/
│   ├── client/                    # React 18 SPA Frontend
│   │   ├── assets/                # Visual assets & logistics backgrounds
│   │   ├── components/            # Modular UI components
│   │   │   ├── common/            # Header, Sidebar, ErrorBoundary, StatusBadge, Modal
│   │   │   └── map/               # Leaflet live GPS corridor maps
│   │   ├── context/               # AuthContext (JWT session), ToastContext (Sanitized alerts)
│   │   ├── hooks/                 # Custom React state & telemetry hooks
│   │   ├── pages/                 # 15 complete operational modules
│   │   │   ├── Login.tsx          # Enterprise Sign-In with Demo Switcher
│   │   │   ├── Register.tsx       # Sign-Up with split logistics hero image
│   │   │   ├── Dashboard.tsx       # Operations Dashboard (Live KPIs, volume trends)
│   │   │   ├── FleetDashboard.tsx  # Fleet Management & Capacity Dashboard
│   │   │   ├── Deliveries.tsx      # Shipment Manifests & Status Board
│   │   │   ├── DeliveryDetails.tsx # Milestone timeline, POD signature viewer
│   │   │   ├── LiveTracking.tsx    # Interactive corridor radar & simulated telemetry
│   │   │   ├── DriverConsole.tsx   # Mobile-first Driver interface with POD signature pad
│   │   │   ├── Vehicles.tsx        # Fleet inventory, odometer, payload checks
│   │   │   ├── Drivers.tsx         # Driver compliance, CDL licenses, roster
│   │   │   ├── Orders.tsx          # Freight booking & unassigned manifest queue
│   │   │   ├── Maintenance.tsx     # Workshop service tickets & downtime logs
│   │   │   ├── Issues.tsx          # Incident tracking (mechanical, traffic, delay)
│   │   │   ├── Reports.tsx         # Executive reports, SLA trends, driver leaderboard
│   │   │   ├── Settings.tsx        # System parameters & depot dispatch settings
│   │   │   └── Admin.tsx           # User provisioning & immutable audit logs
│   │   ├── services/              # Axios API client with safe error normalizers
│   │   ├── types/                 # Shared TypeScript interfaces & models
│   │   ├── App.tsx                # RoleHomeRouter, ProtectedLayout & ErrorBoundary
│   │   └── main.tsx               # Entry point with bundled local Leaflet CSS
│   │
│   └── server/                    # Node.js & Express REST Backend
│       ├── config/                # Environment variables & JWT config
│       ├── middleware/            # authenticateToken & requireRole RBAC
│       ├── routes/                # 12 REST API route controllers
│       │   ├── auth.ts            # Login, demo switcher, register, session verification
│       │   ├── vehicles.ts        # Vehicle CRUD, availability guards, odometer updates
│       │   ├── drivers.ts         # Driver CRUD, CDL validation, GPS updates
│       │   ├── orders.ts          # Order booking, address fallbacks, fee calculations
│       │   ├── deliveries.ts      # Dispatching, driver/vehicle matching, status transitions
│       │   ├── tracking.ts        # Telemetry radar, waypoint simulation
│       │   ├── reports.ts         # KPI aggregations, volume breakdown
│       │   ├── settings.ts        # Depot configuration key-value store
│       │   ├── admin.ts           # User provisioning, system diagnostics, audit log stream
│       │   ├── dashboard.ts       # Live metrics, fleet utilization calculations
│       │   ├── maintenance.ts     # Work orders, vehicle status overrides
│       │   └── issues.ts          # Ticket triage & driver incident reporting
│       ├── app.ts                 # Dual-mounted Express application export
│       ├── prisma.ts              # Prisma Client instance
│       └── server.ts              # Standalone HTTP server runner (Port 5000)
│
├── prisma/                        # Cloud Database Models & Migrations
│   ├── schema.prisma              # MongoDB Atlas Prisma ORM schema
│   └── seed.ts                    # Cloud database seeder with freight corridors
│
├── tests/                         # Automated Quality Assurance Suites
│   ├── backend/test-suite.ts      # Backend API endpoint test suite
│   ├── integration/audit-runner.ts# 48-point comprehensive system audit runner
│   └── smoke/smoke-test-runner.ts # End-to-end operational workflow verification
│
├── vercel.json                    # Vercel production serverless routing & SPA rewrites
├── vite.config.ts                 # Vite bundler configuration & local API proxy
└── package.json                   # Unified root dependencies and script targets
```

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, Lucide Icons, Recharts |
| **Mapping & Telemetry**| Leaflet 1.9 (bundled locally from npm), React-Leaflet |
| **Backend API** | Node.js 20, Express 4.21, TypeScript, ts-node |
| **Database & ORM** | **MongoDB Atlas Cloud Database**, Prisma ORM 5.22 |
| **Authentication & RBAC** | JWT (JSON Web Tokens), bcryptjs, Dual-mount Middleware |
| **Cloud Deployment** | Vercel Serverless Functions + Global Edge CDN |

---

## 👥 Role-Based Access Control (RBAC) & Demo Credentials

LOGISTIX enforces a strict 4-role hierarchy. Unauthenticated requests are rejected with **401 Unauthorized**, and unauthorized actions are rejected with **403 Forbidden**.

| Role | Demo Email | Password | Primary Landing | Permissions & Access Scope |
|---|---|---|---|---|
| **`ADMIN`** | `admin@fleetops.io` | `admin123` | Operations Dashboard | Full administrative control, user provisioning, system diagnostics, security audit logs. |
| **`DISPATCHER`** | `dispatcher@fleetops.io` | `dispatch123` | Operations Dashboard | Freight order booking, shipment dispatching, vehicle/driver matching, live tracking. |
| **`DRIVER`** | `driver@fleetops.io` | `driver123` | Driver Console | Dedicated mobile-first trip interface, milestone progression, digital signature capture (POD). |
| **`VIEWER`** | `viewer@example.com` | `password123` | Operations Dashboard | Read-only visibility into operational metrics, active tracking radar, and reports. Blocked from mutations. |

---

## 🚚 Core Operational Modules

1. **Operations Dashboard**: Real-time KPI cards (Active Deliveries, Fleet Utilization, Available Drivers, Pending Orders, Revenue), 7-day shipment volume charts, and active manifest table.
2. **Fleet Operations Dashboard**: High-density capacity gauge, vehicle category breakdown (Semi-Trailers, Reefer Trucks, Box Trucks, EV Vans, Sprinter Vans), and maintenance alerts.
3. **Freight Orders & Booking**: Book customer freight shipments with automated distance-based pricing, cargo type selection, and priority flags.
4. **Deliveries & Dispatch Board**: Assign eligible drivers and vehicles, preventing double-booking and payload capacity violations.
5. **Shipment Details & Timeline**: Interactive chronological milestone stream with GPS coordinates and Proof of Delivery (POD) signature inspection.
6. **Live GPS Tracking**: Real-time corridor telemetry map powered by Leaflet, displaying live origin-to-destination routes and step simulation.
7. **Mobile-Ready Driver Console**: Built for tablets and mobile devices; allows drivers to accept shipments, log delay reasons, and capture recipient signatures on glass.
8. **Vehicle Inventory Management**: Complete vehicle lifecycle management (VIN, license plate, odometer, fuel/charge level, payload capacity, and status).
9. **Driver Compliance & Roster**: Driver profile management, CDL license class tracking, expiration alerts, safety ratings, and duty availability.
10. **Workshop Maintenance**: Preventative maintenance work orders, odometer-triggered service reminders, and vehicle downtime status locks.
11. **Incident & Issue Reporting**: Driver-reported route interruptions, mechanical breakdowns, and delivery exceptions with priority triage.
12. **Analytics & Performance Reports**: Driver performance leaderboards, delivery delay root-cause analysis, and fleet utilization summaries.
13. **Depot Parameters & Settings**: Configurable operational parameters (max driving hours, speed alert thresholds, dispatch auto-assignment).
14. **System Administration & Audit Logs**: User account management with role assignment, server health diagnostics, and immutable security audit logs.
15. **Enterprise Authentication**: Dedicated split-screen Sign-In and Sign-Up pages with professional logistics imagery, safe error handling, and demo account switchers.

---

## 🔄 Delivery Lifecycle State Machine

Shipments advance through a strictly enforced sequential workflow:

```
[ PENDING ORDER ]
       │
       ▼ (Dispatcher assigns Driver + Vehicle)
 [ DISPATCHED ] ──► (Vehicle: IN_TRANSIT, Driver: ON_DELIVERY)
       │
       ▼ (Driver confirms collection at origin)
 [ PICKED UP ]
       │
       ▼ (Highway transit & live GPS telemetry)
 [ IN TRANSIT ]
       │
       ▼ (Arrival in final destination corridor)
[ OUT FOR DELIVERY ]
       │
       ▼ (Recipient signature captured on glass)
  [ DELIVERED ] ──► (Vehicle: AVAILABLE, Driver: AVAILABLE, Order: DELIVERED)
```

---

## 🛠️ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0+` or `v20.0+`
- **npm**: `v9.0+`
- **MongoDB Atlas** cluster or connection URI

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/Benedict-Edwin/Logistics-management.git
cd Logistics-management
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and provide your MongoDB Atlas connection string:
```bash
cp .env.example .env
```
Inside `.env`:
```env
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.sgo45cn.mongodb.net/logistics?retryWrites=true&w=majority&appName=Cluster0"
JWT_SECRET="nexus-fleetops-secret-key-production-2026"
PORT=5000
NODE_ENV="development"
```

### 4. Push Schema & Seed Cloud Database
```bash
# Push Prisma schema to MongoDB Atlas
npm run db:push

# Seed MongoDB Atlas with initial fleet, drivers, orders, and demo accounts
npm run db:seed
```

### 5. Launch Development Server
```bash
# Concurrently runs Express API (:5000) and Vite React Client (:5173)
npm run dev
```
- **Web App**: `http://localhost:5173`
- **API Server**: `http://localhost:5000/api`
- **Healthcheck**: `http://localhost:5000/api/health`

---

## 🧪 Verification & Automated Audits

Execute the built-in end-to-end verification and integration test suites:

```bash
# Run the 48-point comprehensive system audit against MongoDB Atlas
npm run test:audit

# Compile and verify production build (0 TypeScript & 0 build errors)
npm run build
```

---

## 🌐 Production Deployment on Vercel

LOGISTIX is preconfigured for zero-configuration serverless deployment on Vercel:

1. Import the repository in the **Vercel Dashboard**.
2. Configure the following **Environment Variables** in Vercel (`Settings` -> `Environment Variables`):
   - `DATABASE_URL`: `mongodb+srv://<username>:<password>@cluster0.sgo45cn.mongodb.net/logistics?retryWrites=true&w=majority&appName=Cluster0`
   - `JWT_SECRET`: `your-jwt-secret-key-production-2026`
3. Vercel will execute the `vercel-build` script (`npx prisma generate && tsc && vite build`) and route all API requests to the serverless function handlers in `api/`.

---

## 📄 License
MIT License. Developed by Benedict Edwin.
