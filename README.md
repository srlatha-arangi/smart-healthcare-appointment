# MediCore — Healthcare Platform with Emergency Ambulance Request & Tracking

> ⚠️ **DEMO / MOCK EMERGENCY SERVICE** — This is a working prototype for demonstration and
> development purposes. Hospitals, ambulances, and ambulance GPS movement are simulated with
> mock data. **Do not rely on this system for real medical emergencies — always call your local
> emergency number directly.**

## What this is

A full-stack MERN application:

- **Frontend:** React 18 + Vite + React Router + Tailwind CSS + Leaflet (OpenStreetMap) + Socket.IO client
- **Backend:** Node.js + Express.js + MongoDB (Mongoose) + JWT auth + Socket.IO
- **Core feature:** an Emergency button that lets a patient request an ambulance, automatically
  finds the nearest suitable hospital (available ED + available ambulance) using the Haversine
  formula, and gives both the patient and the hospital a real-time, Socket.IO-driven tracking
  experience through a full status pipeline.

## Project structure

```
medicore/
├── backend/
│   ├── config/db.js                  # MongoDB connection
│   ├── models/                       # User, Hospital, EmergencyRequest (Mongoose schemas)
│   ├── controllers/                  # auth, hospital, emergency, hospitalDashboard logic
│   ├── routes/                       # Express route definitions
│   ├── middleware/                   # JWT auth, role authorization, rate limiting, file upload, error handler
│   ├── sockets/socketHandler.js      # Socket.IO auth + room management
│   ├── utils/haversine.js            # Distance calculation
│   ├── utils/hospitalSelector.js     # Nearest-suitable-hospital selection algorithm
│   ├── data/mockHospitals.js         # Mock hospital + ambulance dataset
│   ├── data/seed.js                  # Seeds MongoDB with mock hospitals + a demo hospital-staff login
│   ├── uploads/                      # Accident photo uploads (created at runtime)
│   ├── server.js                     # App entrypoint
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/                    # Login, Register, Home, Profile, Hospitals, Appointments,
    │   │                             # SpecialRoom, Emergency, EmergencyTracking, HospitalDashboard
    │   ├── components/               # Navbar, EmergencyModal, MapView, StatusTimeline, ProtectedRoute
    │   ├── context/AuthContext.jsx   # Auth state + Socket.IO connection lifecycle
    │   ├── services/api.js           # Axios client with JWT interceptor
    │   └── services/socket.js        # Socket.IO client wrapper
    └── .env.example
```

## Prerequisites

- Node.js 18+
- MongoDB running locally (or a connection string to Atlas / another instance)

## Installation & setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set MONGO_URI, and a strong random JWT_SECRET

# Make sure MongoDB is running, then seed mock hospitals + a demo hospital-staff account:
npm run seed

# Start the API (with auto-reload):
npm run dev
# or: npm start
```

The API runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

Seeding prints a demo hospital-staff login, e.g.:
```
email: hospital.staff@medicore.demo
password: Staff@123
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional for local dev; Vite's dev-server proxy handles /api, /uploads, /socket.io
npm run dev
```

The app runs on `http://localhost:5173` and proxies API/websocket traffic to the backend
(see `frontend/vite.config.js`).

### 3. Try the full emergency workflow

1. **Register** a new patient account at `/register` (or log in if you already have one).
2. Optionally fill out your **Profile** with blood group, allergies, medical info, and an
   emergency contact — this auto-fills into any future emergency request.
3. Click the red **Emergency** button (top-right nav, or on the Home page).
4. Choose **Request Ambulance**.
5. Approve the browser's GPS/location permission prompt. This uses the browser
   `navigator.geolocation` API to get your coordinates and displays them on a Leaflet/OpenStreetMap
   map, along with the nearest hospitals.
6. Fill in symptoms, severity, and confirm/adjust your medical details (optionally attach an
   accident photo), then submit.
7. You'll see: *"An ambulance request is being sent to the nearest available hospital."* and be
   taken to the **Emergency Tracking** page, which shows a status timeline starting at
   **Hospital Notified** — note the system does **not** claim an ambulance is dispatched until a
   hospital actually accepts and assigns one.
8. **Open a second browser window/incognito tab**, log in as the seeded hospital-staff account
   (`hospital.staff@medicore.demo` / `Staff@123`), and go to **Hospital Dashboard**. The new
   request appears there in real time (via Socket.IO) with patient info, symptoms, severity,
   location, and distance.
9. On the dashboard: **Accept** the request, then **Assign Ambulance**. Use the **Mark: ...**
   buttons to advance the ambulance through **On the Way → Arrived at Patient → Patient Picked Up
   → Arrived at Hospital**.
10. Switch back to the patient's tracking screen — status updates arrive live via Socket.IO with
    no page refresh, and the map shows patient, hospital, and (once assigned) a mock ambulance
    marker.

### Status flow implemented

```
Emergency Request Created → Hospital Notified → Ambulance Assigned →
Ambulance On the Way → Ambulance Arrived → Patient Picked Up → Arrived at Hospital
```
(`ACCEPTED` is an intermediate hospital-side state between "notified" and "ambulance assigned".)

## Key implementation notes

- **Hospital selection algorithm** (`backend/utils/hospitalSelector.js` +
  `backend/utils/haversine.js`): filters hospitals to those with an available emergency department
  *and* at least one available ambulance within a configurable radius, computes distance via the
  Haversine formula, and sorts ascending by distance. The nearest suitable hospital is auto-selected;
  the next few alternates are returned too.
- **Auto-population of medical info**: if the patient didn't type a field (blood group, allergies,
  medical info) into the emergency form, the backend falls back to their verified profile data.
- **JWT authentication** protects all API routes except register/login; `protect` middleware
  verifies the token and loads the user, `authorize(...roles)` restricts hospital-dashboard routes
  to `hospital_staff`/`admin`.
- **Duplicate-request prevention**: `POST /api/emergency/request-ambulance` checks for an existing
  active request for the same patient and returns `409` with the existing request's ID instead of
  creating a second one.
- **Rate limiting**: general API limiter, a stricter auth limiter, and a dedicated emergency-request
  limiter (`express-rate-limit`) to prevent abuse while still allowing genuine urgent use.
- **File uploads**: accident photos go through `multer` with MIME-type allowlisting and a file-size
  cap (`middleware/upload.js`), stored under `backend/uploads` and served statically.
- **Real-time updates**: Socket.IO rooms are `patient:<userId>` and `hospital:<hospitalId>`; the
  socket handshake is authenticated with the same JWT used for REST calls
  (`backend/sockets/socketHandler.js`).
- **Error handling**: geolocation denial, network failures, no available hospitals, hospital
  rejection, and duplicate requests are all handled with clear user-facing messages rather than
  silent failures or crashes.
- **Security**: `helmet`, CORS restricted to the configured client origin, password hashing with
  `bcryptjs`, input validation on required emergency fields, and ownership/role checks before any
  patient or hospital-staff action.

## API reference (summary)

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a patient (or hospital_staff) account |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update medical profile |
| GET | `/api/hospitals` | List all hospitals |
| GET | `/api/hospitals/nearby?lat=&lng=` | Hospitals ranked by distance |
| POST | `/api/emergency/request-ambulance` | Create an emergency request (multipart form, JWT required) |
| GET | `/api/emergency/my-active` | Patient's current active request (for resuming tracking) |
| GET | `/api/emergency/history` | Patient's past requests |
| GET | `/api/emergency/:id` | Get one request (owner, assigned hospital staff, or admin) |
| POST | `/api/emergency/:id/cancel` | Cancel before pickup |
| GET | `/api/hospital-dashboard/requests` | Active requests for the staff member's hospital |
| POST | `/api/hospital-dashboard/requests/:id/accept` | Accept a request |
| POST | `/api/hospital-dashboard/requests/:id/reject` | Reject a request |
| POST | `/api/hospital-dashboard/requests/:id/assign-ambulance` | Assign an ambulance |
| PATCH | `/api/hospital-dashboard/requests/:id/status` | Advance ambulance status |

## Known limitations of the prototype

- Hospitals and ambulance movement are **mock data**, not a live hospital network or GPS feed —
  clearly labeled in the UI as DEMO / MOCK EMERGENCY SERVICE.
- No SMS/push notifications; real-time delivery is via Socket.IO to connected clients only.
- No payment/insurance flow (out of scope for the emergency workflow requested).
- `VITE_API_BASE_URL` in the frontend `.env.example` is a placeholder for separate-origin
  deployments; local dev uses Vite's proxy instead.

## Testing the workflow end-to-end (checklist)

- [ ] Patient Login → Home shows Emergency button
- [ ] Emergency → Request Ambulance → GPS permission prompt appears
- [ ] Deny permission once to see the graceful error message, then allow it
- [ ] Nearby hospitals list + map render correctly
- [ ] Submit request → "being sent to nearest hospital" message → tracking screen (Hospital Notified)
- [ ] Hospital dashboard (second session) receives the request in real time
- [ ] Accept → Assign Ambulance → advance through all statuses
- [ ] Patient tracking screen updates live at every step without refreshing
- [ ] Try submitting a second request while one is active → duplicate-prevention message
- [ ] Reject a request from the hospital side and confirm the patient sees the rejection
