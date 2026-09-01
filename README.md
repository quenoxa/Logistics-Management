# Nexus FleetOps — Logistics & Fleet Operations Command Platform

A fully functional, end-to-end logistics and fleet management web application engineered for freight dispatchers, fleet managers, and operations coordinators. Built with a dedicated Express.js + TypeScript REST backend, SQLite database with Prisma ORM, and a high-density React (Vite + TailwindCSS + Leaflet + Recharts) frontend.

---

## ⚡ Quick Start Guide

### 1. Launch Full Stack (Single Command)
From the root directory:
```bash
# Starts both the backend API (Port 5000) and frontend SPA (Port 5173) concurrently
npm run dev
```

Alternatively, run in separate terminals:
```bash
# Terminal 1: Backend API
cd backend
npm run dev

# Terminal 2: Frontend SPA
cd frontend
npm run dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🔑 Demo Accounts & One-Click Presets

The login screen includes **one-click demo login buttons** for instant testing across all RBAC roles:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@fleetops.io` | `admin123` | Full access (Users, Audit Logs, Settings, Dispatch, Fleet) |
| **Dispatcher** | `dispatcher@fleetops.io` | `dispatch123` | Orders, Deliveries, State Machine transitions, Live Radar |
| **Fleet Ops Manager** | `ops@fleetops.io` | `ops123` | Vehicle Fleet, Maintenance scheduling, Driver roster |
| **Commercial Driver** | `driver@fleetops.io` | `driver123` | View assigned routes, delivery status |

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM v5, SQLite (`dev.db`), JWT Auth, bcryptjs, Zod validation.
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS (Operations Dark Theme), Leaflet & React-Leaflet, Recharts, Lucide Icons, Date-fns, Axios.
- **Data Engine**: Real SQL database with foreign key constraints, ACID transaction state machines, anti-double-booking checks, and dynamic aggregation queries.

---

## 🖥️ Screen & Feature Overview

### 1. **Login Screen (`/login`)**
- Secure JWT email/password authentication.
- One-click demo role presets for instant evaluation.
- Protected route middleware preserving authentication session.

### 2. **Operations Dashboard (`/`)**
- 8 real-time KPI widgets (Active Deliveries, Fleet Utilization %, Available Drivers, On-Time SLA %, Pending Orders, Completed Shipments, Exceptions, Total Revenue).
- Live Metro Freight Radar mini-map with real-time asset coordinates.
- Active Deliveries Ticker with live progress bars.
- One-click simulation step trigger to advance fleet coordinates in real-time.

### 3. **Fleet Vehicles (`/vehicles`)**
- Commercial fleet asset table with multi-filter (Status: Active, In Transit, Maintenance, Idle; Class: Semi-Trailer, Box Truck, EV Van, Reefer, Sprinter).
- Real-time fuel/battery gauges, odometer readings, and assigned driver pairings.
- **Register New Vehicle modal** with validation for VIN, payload capacity, and fuel platform.
- **Vehicle Detail & Maintenance Drawer**: Complete asset specs + service history log + **Log Service / Schedule Maintenance form**.

### 4. **Driver Roster (`/drivers`)**
- Commercial driver roster with CDL class, expiration dates, safety ratings, and delivery counts.
- **Live shift availability switcher** (toggle between `AVAILABLE`, `OFF_DUTY`, `ON_LEAVE` directly from the table).
- Anti-double-booking locks preventing dispatching drivers who are on active deliveries.
- Onboard new driver modal with certification recording.

### 5. **Orders & Freight Manifest (`/orders`)**
- Multi-dimensional filtering by cargo type (`Cold Chain -20°C`, `HazMat Class 3`, `General Freight`, `Perishable`, `High Value`) and priority.
- **Book New Cargo Order modal** with origin/destination address and cargo volume/weight parameters.
- **Dispatch Assignment Workflow Modal**:
  - Automatically suggests available drivers and compatible vehicles with sufficient payload capacity.
  - Validates anti-double-booking and creates linked delivery.

### 6. **Deliveries Dispatch Command (`/deliveries`)**
- Central dispatch manifest table with tracking numbers (`TRK-XXXXXX`), route distances, progress bars, and status badges.
- Filter by status, priority, driver, and vehicle.

### 7. **Delivery Details & State Machine (`/deliveries/:id`)**
- Full 6-step lifecycle visualizer: `ORDER_PLACED` &rarr; `DISPATCHED` &rarr; `PICKED_UP` &rarr; `IN_TRANSIT` &rarr; `OUT_FOR_DELIVERY` &rarr; `DELIVERED`.
- **Interactive State Machine Transition Modal**: advances lifecycle state, records delay reasons, or captures digital POD recipient signatures.
- Timestamped audit timeline with recorded personnel and GPS coordinates for every milestone.
- Embedded corridor route map showing origin, destination, and vehicle position.

### 8. **Live GPS Telemetry & Radar (`/tracking`)**
- Interactive Leaflet dark radar map with waypoint polylines and animated vehicle markers.
- **Tactical Telemetry HUD**: Ground speed (km/h), compass heading, dynamic ETA countdown, cargo temp (°C), battery/fuel %, and 5G signal status.
- **Simulation Engine**: Step selected vehicle, step all fleet vehicles, or toggle **Auto-Play Simulation** to watch deliveries progress automatically.

### 9. **Reports & Analytics (`/reports`)**
- **7-Day Delivery Volume Trend**: Interactive bar chart comparing On-Time vs Delayed vs Dispatched shipments.
- **Delay Root Causes Breakdown**: Interactive donut chart analyzing traffic, weather, dock queues, and inspection holds.
- **Fleet Asset Utilization**: Mileage and maintenance cost analysis grouped by commercial vehicle class.
- **Driver Leaderboard**: Performance scorecard ranking by total deliveries and on-time SLA rate.
- **Export Analytics (CSV)**: Instant client-side download of delivery manifest data.

### 10. **System Configuration (`/settings`)**
- Hub depot geolocation parameters (Port of NY/NJ coordinates).
- Dispatch automation rules and maximum driver daily hours (DOT compliance).
- Alert triggers: Speed limit alerts (km/h), delay warning threshold (min), low fuel alert (%).
- Measurement unit toggle (Metric / Imperial).

### 11. **Admin Console & Audit Stream (`/admin`)**
- RBAC Operator user management (Create, Edit Role/Status, Reset Password, Delete).
- **Cryptographic Audit Stream**: Filterable log of every login, dispatch, state transition, and configuration update.
- **Engine Health Diagnostics**: Real-time server uptime, memory usage (Heap & RSS), and live database table entity counts.

---

## 🧪 Verification & Testing

To run the automated backend test suite:
```bash
cd backend
npx ts-node src/test-suite.ts
```

All 19 tests will execute and verify authentication, vehicles, drivers, orders, state machine transitions, anti-double-booking locks, and dynamic aggregations.
