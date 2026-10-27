# 🎬 iMovies — Full-Stack Cinema Management and Online Ticket Booking System

A production-minded, responsive full-stack MERN cinema platform built for movie discovery, multiplex management, real-time seat locking, conflict-free scheduling, and secure ticket booking.

---

## 🌟 Key Features

1. **Movie Discovery & City Filtering**
   - High-quality cinema hero banners, trailer modal, synopsis, cast, crew, and certifications (`U`, `UA`, `A`, `S`).
   - City-level filtering across Mumbai, Bengaluru, Delhi NCR, Hyderabad, and Chennai.
   - Live multi-parameter search, genre, language, and format filters (`2D`, `3D`, `IMAX Laser`, `4DX`).

2. **Real-Time Interactive Seat Selection**
   - Auditorium seating layout with curved screen projection indicator and row categorization (`Silver`, `Gold`, `Platinum`, `VIP`).
   - Wheelchair-accessible spots, aisle gaps, and pricing breakdown.
   - **5-Minute Atomic Seat Hold**: Seats are locked atomically on the backend; WebSocket (Socket.IO) synchronizes seat locks across all viewing clients in real time.
   - **Double-Booking & Race Condition Immunity**: Server-side uniqueness constraints and transaction safeguards prevent multiple users from acquiring the same seats.

3. **Secure Checkout & Payments**
   - Itemized fare breakdown: base ticket price, convenience fees (₹25/ticket), and 18% integrated GST.
   - Promo discount voucher support (`CINEMA50`, `IMOVIES100`).
   - Dual Payment Architecture:
     - **Mock Simulation Mode**: Zero external setup required for local development. Full server-side order and signature verification.
     - **Razorpay Mode**: Test-mode payment integration with cryptographic HMAC SHA256 signature verification.
     - Simulated decline button to verify proper error handling during failed transactions.

4. **Digital Pass & Booking History**
   - Instant digital ticket generation with high-density QR code pass.
   - Print-friendly ticket pass rendering.
   - Booking history with status tracking (`Confirmed`, `Cancelled`, `Past`).

5. **Automated Cancellation & Refunds**
   - Self-service cancellation for eligible bookings up to 2 hours before showtime.
   - Automated 85% base fare refund calculation with non-refundable convenience fee retention.
   - Immediate seat release back to the available seating pool via Socket.IO.

6. **Comprehensive Admin Dashboard**
   - Real database metric calculations: Gross Revenue, Occupancy Rate (%), Total Bookings, Active Theatres, and Catalogue Movies.
   - Movie Catalogue CRUD with safe archival policies.
   - Multiplex & Screen Management.
   - Showtime Scheduler with automatic screen collision and time overlap detection.
   - Customer reservations inspection and user account status toggles (`Active` / `Suspended`).

---

## 🏗️ Architecture & Technology Stack

```
imovies/
  client/               # React 19 + Vite 6 + Bootstrap 5 + Lucide Icons + Socket.io-client
    src/
      components/       # Reusable UI, SeatMap, HeroBanner, MovieCard, CityModal
      pages/            # Public, Booking Flow, User Account, and Admin Portal pages
      context/          # AuthContext, BookingContext, SocketContext
      services/         # Axios API clients for Auth, Movies, Theatres, Shows, Bookings, Admin
      styles/           # Dark cinema-inspired theme & custom seat CSS
  server/               # Node.js LTS + Express + Mongoose + Socket.IO + JWT + Bcryptjs
    config/             # Database connection with MongoMemoryServer fallback & config
    controllers/        # HTTP route handlers
    middleware/         # JWT auth, Role authorization, Rate limiters, Error handling
    models/             # User, Movie, Theatre, Screen, Show, Booking, Payment, SeatHold, Notification
    routes/             # RESTful API endpoints mounted under /api/v1
    services/           # Atomic SeatHoldService, BookingService, PaymentService
    sockets/            # Real-time seat room broadcasting
    tests/              # Automated Supertest & Vitest test suites
    seed.js             # Repeatable development seed script
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js LTS** (v18, v20, or v24)
- **pnpm** or **npm**

> **Note on MongoDB:** If no `MONGODB_URI` is provided, iMovies **automatically launches an embedded MongoDB engine** (`mongodb-memory-server`) locally. Zero external database installation is required!

### 2. Installation
From the root directory:

```bash
# Install root, server, and client dependencies
pnpm install:all
```
*(Or navigate into `server` and `client` individually and run `pnpm install`)*

### 3. Seed Sample Database
Populate the database with realistic movies, multiplexes in 5 major Indian cities, multi-tier screen layouts, and scheduled shows:

```bash
cd server
node seed.js
```

### 4. Running the Development Servers
In two separate terminals:

**Terminal 1 — Backend (Port 5000):**
```bash
cd server
node server.js
```

**Terminal 2 — Frontend (Port 5173):**
```bash
cd client
pnpm dev
```

Open your browser at: **`http://localhost:5173`**

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@imovies.com` | `Admin@123` | Full access to `/admin` dashboard, movie CRUD, theatre config, schedule shows |
| **Demo User** | `user@imovies.com` | `User@123` | Ticket booking, real-time seat lock, cancellations, profile |

*Both login and registration forms also include fast one-click demo credentials fill buttons for instant testing.*

---

## 🧪 Running Automated Tests

A comprehensive automated test suite covers Authentication, Admin Authorization, Movie Discovery, Seat Hold Concurrency, Payment Order Creation, Atomic Finalization, and Cancellation Policies:

```bash
cd server
pnpm test
```

**Test Results:**
```
✓ tests/api.test.js (18 tests)
  ✓ 1. Authentication & Role Authorization > should register a new user successfully with role "user"
  ✓ 1. Authentication & Role Authorization > should reject registration with duplicate email
  ✓ 1. Authentication & Role Authorization > should reject login with wrong password
  ✓ 1. Authentication & Role Authorization > should allow access to /api/v1/auth/me with valid token
  ✓ 1. Authentication & Role Authorization > should block regular user from admin-only routes
  ✓ 1. Authentication & Role Authorization > should allow admin user to access /api/v1/admin/stats
  ✓ 2. Movie Discovery & Showtime Filtering > should return list of movies with pagination and genres
  ✓ 2. Movie Discovery & Showtime Filtering > should filter movies by search query
  ✓ 2. Movie Discovery & Showtime Filtering > should retrieve movie details with distinct cities
  ✓ 2. Movie Discovery & Showtime Filtering > should fetch shows for movie and retrieve seat layout
  ✓ 3. Seat Hold, Booking & Concurrency Integrity > should successfully create a temporary seat hold
  ✓ 3. Seat Hold, Booking & Concurrency Integrity > should prevent another user from holding the same seats (concurrency protection)
  ✓ 3. Seat Hold, Booking & Concurrency Integrity > should initiate a pending booking using the valid hold
  ✓ 4. Payment Order Creation & Verification > should create a payment order for the booking
  ✓ 4. Payment Order Creation & Verification > should verify payment and finalize booking atomically
  ✓ 4. Payment Order Creation & Verification > should show the confirmed booking in the user's booking history
  ✓ 5. Cancellations & Refund Rules > should cancel the eligible booking and calculate refund
  ✓ 5. Cancellations & Refund Rules > should reject duplicate cancellation of already cancelled booking

Test Files  1 passed (1)
Tests       18 passed (18)
```

---

## ⚙️ Environment Configuration (`.env.example`)

### Backend (`server/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Optional: MongoDB Atlas or local MongoDB connection URI
# If left blank, iMovies automatically spins up an embedded MongoDB instance
MONGODB_URI=

JWT_SECRET=imovies_super_secret_jwt_key_development_2026_xyz!@#
JWT_EXPIRES_IN=7d
COOKIE_SECRET=imovies_cookie_signing_secret_987654321

# Payment Configuration
# Set to 'mock' for local development simulation or 'razorpay' for live gateway
PAYMENT_MODE=mock
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Business Settings
SEAT_HOLD_DURATION_MINUTES=5
CANCELLATION_CUTOFF_HOURS=2
CANCELLATION_REFUND_PERCENT=85
CONVENIENCE_FEE_PER_TICKET=2500
GST_RATE_PERCENT=18
```

### Frontend (`client/.env`):
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🛡️ Concurrency & Double-Booking Prevention

1. **State Machine Verification:** Seat states follow a strict transition: `AVAILABLE` -> `HELD` -> `BOOKED`.
2. **Atomic Hold Acquisition:** When a user selects seats, `SeatHoldService` queries for existing confirmed bookings and unexpired active holds in a single atomic database query. If any seat is already contested, the request is rejected with HTTP `409 Conflict`.
3. **Lazy & Background Expiry Cleanup:** Expired seat holds are released automatically through both a 30-second background worker and lazy checks prior to new holds.
4. **Permanent Seat Finalization:** At checkout, cryptographic payment verification re-checks that the hold token belongs to the purchasing user, is not expired, and confirms the seats atomically.

---

## 📄 License
MIT License. Built for the iMovies Cinema Management & Online Ticket Booking System.
