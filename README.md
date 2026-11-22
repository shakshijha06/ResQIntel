# ResQIntel

**Civic Issue Reporting, Incident Intelligence & Resolution Platform**

ResQIntel is a modern full-stack civic operations platform designed to bridge the gap between citizens reporting localized municipal problems and administrative authorities managing coordinated responses. During everyday civic operations—as well as during seasonal disruptions such as heavy monsoon waterlogging or storm recovery—municipal agencies receive hundreds of disparate reports describing the same underlying problems using varied vocabulary, differing locations, and conflicting details.

Rather than treating every citizen submission as an isolated ticket or displaying raw reports in unorganized lists, ResQIntel provides an **AI-assisted report reconciliation and incident clustering architecture**. Behind the scenes, the system identifies potential duplicates, links new developments to existing incidents, and provides administrators with an explainable triage workspace to group related citizen dispatches into unified, actionable municipal incidents.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Key Features](#2-key-features)
  - [Public Portal](#public-portal)
  - [Administrative Operations Desk](#administrative-operations-desk)
- [3. Visual Preview & Screenshots](#3-visual-preview--screenshots)
- [4. Technology Stack](#4-technology-stack)
- [5. System Architecture](#5-system-architecture)
- [6. Application Lifecycle & Workflows](#6-application-lifecycle--workflows)
- [7. Repository Structure](#7-repository-structure)
- [8. Installation & Local Setup](#8-installation--local-setup)
- [9. Environment Variables Reference](#9-environment-variables-reference)
- [10. REST API Directory](#10-rest-api-directory)
- [11. Database & Persistence Design](#11-database--persistence-design)
- [12. Security & Privacy Architecture](#12-security--privacy-architecture)
- [13. Testing & Verification](#13-testing--verification)
- [14. Current Limitations](#14-current-limitations)
- [15. Future Scope](#15-future-scope)
- [16. Academic & Project Information](#16-academic--project-information)
- [17. License](#17-license)

---

## 1. Project Overview

### The Problem
In municipal administration, citizen reports are often fragmented:
- **Multiple Dispatches for One Issue**: When a large pothole causes accidents on a main arterial road or an underground water pipe bursts, dozens of citizens submit reports describing the incident from different vantage points.
- **Reporting Variations**: Citizens report issues using differing terminology (e.g., *"waterlogging near market"* vs. *"choked storm drain on main road"*).
- **Administrative Blind Spots**: Conventional portals create separate tickets for each submission. This clutters the triage queue, distorts municipal workload analytics, and leads to duplicated field dispatches.
- **Lack of Transparent Tracking**: Citizens receive a confirmation number but have no visibility into whether their report was merged with existing neighborhood operations or assigned to a field department.

### The ResQIntel Solution
ResQIntel addresses this through a structured intake, reconciliation, and resolution pipeline:
1. **Intake with Precision Geocoding**: Citizens submit observations with rich category metadata, photographic evidence, and pinpoint street locations powered by **TomTom Maps**.
2. **Deterministic & Semantic Reconciliation**: Incoming reports are evaluated against open incidents using Haversine geographical proximity, category matching, and textual similarity analysis.
3. **Human-in-the-Loop Triage Workspace**: Suspicious candidate pairs are surfaced in an administrative Review Queue with side-by-side verbatim comparisons and optional Google Gemini 2.5 Flash analytical assessments.
4. **Unified Incident Management**: Multiple reports are consolidated into a single municipal incident, assigned to responsible departments (e.g., *Roads & Highway Maintenance*, *Water Supply & Sewerage Board*), and tracked through resolution.
5. **Secure Tracking & Public Transparency**: Citizens track their report's lifecycle using unique reference identifiers while personal information is strictly protected.

---

## 2. Key Features

### Public Portal
- **Pinpoint Civic Reporting**: Form supporting 28 distinct civic categories (potholes, drainage blockages, broken streetlights, water supply leaks, fallen trees, illegal dumping).
- **TomTom Maps Integration**:
  - Live **Places Search Autocomplete** for street names, landmarks, localities, and PIN codes.
  - One-click **"Use My Location"** browser GPS integration with coordinate validation.
  - Interactive map with draggable pin and automatic **Reverse Geocoding** to populate street, city, district, and postal code.
  - Default localized Kolkata metropolitan view (`22.5726, 88.3639`) preventing generic country-level disorientation.
- **Evidence Attachment**: Client-side validated direct photo/video uploads (JPG, PNG, WebP up to 5MB).
- **Public Reports & Incident Explorer**: Searchable, filterable directory of community alerts and published incident bulletins with progress timelines.
- **Public Civic Map**: Full-screen interactive map displaying confirmed incidents with priority-coded markers and click-to-fly street-level zoom (`zoom 16`).
- **Anonymous Tracking**: Secure tracking portal allowing citizens to verify the review status and grouped incident of their submission using their reference token.

### Administrative Operations Desk
- **Role-Based Authentication**: Secure JWT-based administrative access with bcrypt password hashing and brute-force login rate limiting.
- **Executive Operations Dashboard**: Live counts for total reports, grouped incidents, active field dispatches, monitoring directives, and review queue backlogs.
- **Triage & Review Centre**: Dedicated side-by-side reconciliation interface comparing candidate report pairs with spatial distance, timing delta, category alignment, and plain-English reasons.
- **Explainable AI Integration**: On-demand structured comparisons powered by Google Gemini 2.5 Flash providing recommendation classifications (`confirm_match`, `mark_non_match`, `mark_uncertain`) with confidence scores.
- **Incident Lifecycle Management**: Status transitions (`under_review`, `in_progress`, `monitoring`, `resolved`), department assignment, priority reclassification, and internal action update logging.
- **Geospatial Incident Explorer**: Full operational canvas mapping verified clusters with smooth camera flights to exact coordinates upon issue selection.
- **Audit Logging & Activity Tracking**: Tamper-evident operational audit logs recording all administrative actions, review decisions, and incident modifications.

---

## 3. Visual Preview & Screenshots

The platform includes clean, high-contrast dark operations room styling inspired by crisis management systems (ArcGIS Mission, Ushahidi, and Sahana Eden).

| View | Description | Reference Asset |
| :--- | :--- | :--- |
| **Homepage** | Hero portal with live counters, categories, and emergency notice. | [`docs/screenshots/fig_5_1_homepage.png`](docs/screenshots/) |
| **Location Selector** | TomTom street map with places search and draggable pin. | [`docs/screenshots/fig_5_3_tomtom_picker.png`](docs/screenshots/) |
| **Public Map** | Interactive TomTom map displaying confirmed community incidents. | [`docs/screenshots/fig_5_6_public_map.png`](docs/screenshots/) |
| **Admin Dashboard** | Real-time operational metrics and recent incident feed. | [`docs/screenshots/fig_5_9_dashboard.png`](docs/screenshots/) |
| **Review Centre** | Side-by-side verbatim report triage with similarity indicators. | [`docs/screenshots/fig_5_10_review_centre.png`](docs/screenshots/) |
| **Incident Workspace**| Department assignment, priority control, and progress logs. | [`docs/screenshots/fig_5_11_incident_workspace.png`](docs/screenshots/) |

*For complete capture instructions and figure mappings, see [`docs/screenshots/README.md`](docs/screenshots/README.md).*

---

## 4. Technology Stack

### Frontend Architecture
- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tooling**: Vite 8 with Rollup bundling
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4 with custom dark operations color tokens (`#0D1527`, `#14213D`, `#FF6B58`)
- **Map & Geolocation**:
  - Leaflet (`leaflet`, `react-leaflet`)
  - Official TomTom Map Display API (raster street tiles)
  - TomTom Places Search API & Geocoding API
  - TomTom Reverse Geocoding API
- **Icons**: Lucide React (`lucide-react`)
- **HTTP Client**: Axios with interceptors for JWT token handling

### Backend Architecture
- **Framework**: FastAPI (Python 3.10+)
- **ASGI Server**: Uvicorn
- **Data Validation & Serialization**: Pydantic v2
- **Security & Cryptography**: Passlib (bcrypt hashing), PyJWT (HS256 access tokens), Python `hashlib` (SHA-256 token digests)
- **AI Analytics**: Google GenAI SDK (Gemini 2.5 Flash model) with strict timeout and offline fallbacks

### Persistence Architecture
- **Data Repository Pattern**: Abstracted repository supporting both:
  1. **Local Persistent JSON Storage**: Zero-dependency filesystem JSON database with atomic writes (`reports.json`, `incidents.json`, `reviews.json`, `users.json`, `audit_logs.json`, `notifications.json`, `submission_tracking.json`).
  2. **MongoDB Atlas**: Production-ready connection via PyMongo.

---

## 5. System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 19 + Vite)"]
        PublicUI["Public Portal\n(/report, /reports, /explore, /map, /track)"]
        AdminUI["Admin Operations Desk\n(/admin/dashboard, /admin/reviews, /admin/incidents)"]
        TomTomSDK["TomTom Map Display & Location Services\n(Places Search, Geocoding, Reverse Geocoding)"]
        PublicUI <--> TomTomSDK
        AdminUI <--> TomTomSDK
    end

    subgraph API["Application Tier (FastAPI)"]
        Router["API Gateway / Routers\n(/api/auth, /api/public, /api/admin)"]
        AuthService["Auth & Security Service\n(JWT Bearer, Bcrypt, Rate Limiter)"]
        EmergencyService["Emergency & Incident Service\n(Lifecycle, Auto-linking, Audit Logs)"]
        ReconciliationEngine["Reconciliation Engine\n(Haversine Distance, Jaccard Similarity)"]
        AIService["AI Service (Optional)\n(Google Gemini 2.5 Flash)"]
        
        Router --> AuthService
        Router --> EmergencyService
        EmergencyService --> ReconciliationEngine
        EmergencyService --> AIService
    end

    subgraph Storage["Data Tier (Repository Pattern)"]
        Repo["Database Repository Interface"]
        JSONStorage["Local Persistent JSON\n(Atomic File I/O)"]
        MongoStorage["MongoDB Atlas\n(Production Mode)"]
        
        EmergencyService --> Repo
        Repo -.->|Default| JSONStorage
        Repo -.->|Configured| MongoStorage
    end

    PublicUI -->|HTTP / JSON| Router
    AdminUI -->|JWT Auth HTTP| Router
```

---

## 6. Application Lifecycle & Workflows

- **Password Hashing:** `bcrypt` with salt rounds. Plaintext passwords or hashes are never returned or logged.
- **Tokens:** Short-lived `PyJWT` bearer access tokens (configurable `ACCESS_TOKEN_EXPIRE_MINUTES = 120`).
- **Initial Bootstrap Admin Account:**
  - **Email:** `admin@resqintel.org`
  - **Password:** `setup a strong password`
  - **Role:** `admin`
- **Role Hierarchy:**
  - **ADMIN:** Full operational control; manage user accounts, publish/unpublish bulletins, resolve reviews, update cluster metadata.
  - **REVIEWER:** Inspect reports and review queues, compare dispatches, submit candidate match decisions and notes.
  - **PUBLIC VISITOR:** Submit observations anonymously, track reports via SHA-256 tokens, explore published bulletins.
- **Public Submission Security:**
  - Generates a reference ID (`RSQ-XXXXXX`) and a 32-character tracking token.
  - Only the SHA-256 hash of the tracking token is stored in the database.
  - Personal contact info is masked and never exposed to the public.
```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen User
    participant Frontend as Public Frontend
    participant API as FastAPI Backend
    participant Engine as Reconciliation Engine
    participant DB as Database Storage
    actor Admin as Municipal Admin

    Citizen->>Frontend: Fill civic report & pinpoint map location
    Frontend->>Frontend: TomTom reverse geocoding populates address
    Frontend->>API: POST /api/public/reports (payload + evidence)
    API->>API: Generate reference ID (RPT-YYYY-NNNN) & SHA-256 token
    API->>Engine: Check proximity & category against active incidents
    alt Match Found within 2 km
        Engine-->>API: Existing Incident ID
        API->>DB: Link report to incident & increment count
    else No Match
        API->>DB: Create provisional incident record
    end
    API->>DB: Save report & submission tracking record
    API-->>Frontend: Return reference_id & tracking_token
    Frontend-->>Citizen: Display confirmation & tracking instructions

    Note over API,DB: Background Review Queue Pair Detection
    API->>DB: Generate candidate pair in reviews.json

    Admin->>Frontend: Login to Operations Desk
    Frontend->>API: POST /api/auth/login
    API-->>Frontend: Return JWT Bearer Token
    Admin->>Frontend: Open Review Queue (/admin/reviews)
    Frontend->>API: GET /api/admin/reviews
    API-->>Frontend: Return candidate pairs with similarity scores
    Admin->>Frontend: Inspect side-by-side verbatim reports
    Admin->>Frontend: Click "Same Problem (Group)" or "Different Issues"
    Frontend->>API: POST /api/admin/reviews/{id}/decision
    API->>DB: Update review status & append to audit logs
    API-->>Frontend: Confirmation & queue refresh
```

---

## 7. Repository Structure

```
RESQINTEL/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   └── api.py                  # All REST API route definitions
│   │   ├── schemas/
│   │   │   └── schemas.py              # Pydantic request & response models
│   │   ├── services/
│   │   │   ├── ai_service.py           # Gemini 2.5 Flash extraction & comparison
│   │   │   ├── dataset_service.py      # Dataset import & batch processing
│   │   │   ├── emergency_service.py    # Core business logic & incident lifecycle
│   │   │   └── reconciliation_engine.py# Mathematical similarity & proximity algorithms
│   │   ├── utils/
│   │   │   ├── dependencies.py         # FastAPI dependency injection & role guards
│   │   │   └── security.py             # Password hashing, JWT tokens, rate limiting
│   │   ├── config.py                   # Application settings & environment loader
│   │   ├── database.py                 # Repository interface (JSON & MongoDB Atlas)
│   │   └── main.py                     # ASGI application factory & CORS setup
│   ├── data/                           # Local persistent JSON database directory
│   │   ├── audit_logs.json             # Administrative action history
│   │   ├── incidents.json              # Grouped municipal incident records
│   │   ├── notifications.json          # System alerts for operations team
│   │   ├── reports.json                # Verbatim citizen report records
│   │   ├── reviews.json                # Candidate pairs for human verification
│   │   ├── submission_tracking.json    # Hashed citizen tracking tokens
│   │   └── users.json                  # Admin and reviewer credentials
│   ├── requirements.txt                # Python backend dependencies
│   ├── seed_demo_data.py               # Idempotent civic dataset seed script
│   └── test_civic_platform.py          # End-to-end automated test suite
├── docs/
│   ├── screenshots/                    # Application capture registry & checklist
│   │   └── README.md
│   └── PROJECT_GUIDE.md                # Comprehensive 1-day developer technical manual
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminSidebar.jsx        # Responsive operations sidebar drawer
│   │   │   ├── AdminTopbar.jsx         # Administrative header with notifications
│   │   │   ├── LocationPickerMap.jsx   # TomTom interactive location search & pin drop
│   │   │   ├── LogoMark.jsx            # Brand SVG iconography
│   │   │   ├── ProtectedRoute.jsx      # Role-based route authorization guard
│   │   │   ├── StatusBadge.jsx         # High-contrast operational status pills
│   │   │   ├── TomTomMap.jsx           # Reusable shared TomTom street map
│   │   │   └── TomTomMapNotice.jsx     # Informative API key configuration banner
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx         # React authentication & session context
│   │   ├── layouts/
│   │   │   ├── AdminLayout.jsx         # Operations layout with responsive drawer
│   │   │   └── PublicLayout.jsx        # Public portal layout with mobile drawer
│   │   ├── pages/
│   │   │   ├── admin/                  # Administrative management pages
│   │   │   │   ├── AdminLoginPage.jsx
│   │   │   │   ├── AdminReportDetailPage.jsx
│   │   │   │   ├── AuditLogsPage.jsx
│   │   │   │   └── UserManagementPage.jsx
│   │   │   ├── public/                 # Citizen-facing public pages
│   │   │   │   ├── FAQPage.jsx
│   │   │   │   ├── HowItWorksPage.jsx
│   │   │   │   ├── PublicExplorerPage.jsx
│   │   │   │   ├── PublicIncidentDetailPage.jsx
│   │   │   │   ├── PublicLandingPage.jsx
│   │   │   │   ├── PublicMapPage.jsx
│   │   │   │   ├── PublicReportDetailPage.jsx
│   │   │   │   ├── PublicReportPage.jsx
│   │   │   │   ├── PublicReportsPage.jsx
│   │   │   │   └── PublicTrackPage.jsx
│   │   │   ├── DashboardPage.jsx       # Executive command dashboard
│   │   │   ├── IncidentDetailsPage.jsx # Municipal incident workspace
│   │   │   ├── IncidentExplorerPage.jsx# Incident registry card grid
│   │   │   ├── MapExplorerPage.jsx     # Command canvas with TomTom street tiles
│   │   │   ├── ReportsManagementPage.jsx # Full reports repository
│   │   │   ├── ReviewCentrePage.jsx    # Side-by-side triage workspace
│   │   │   └── SettingsPage.jsx        # Admin profile settings
│   │   ├── services/
│   │   │   ├── api.js                  # Axios client & backend endpoints
│   │   │   └── tomtomService.js        # Official TomTom REST services
│   │   ├── App.jsx                     # Application routing & route boundaries
│   │   ├── main.jsx                    # React application entry point
│   │   └── style.css                   # Tailwind v4 directives & theme tokens
│   ├── .env.example                    # Frontend environment configuration template
│   ├── package.json                    # Frontend dependencies & scripts
│   └── vite.config.js                  # Vite bundler configuration
├── PROJECT_REPORT.md                   # Formal B.Tech CSE academic project report
├── PROJECT_REPORT.docx                 # Formatted academic Word document
├── .gitignore                          # Git exclusion rules (ignores secrets & .env.local)
└── README.md                           # Master project documentation (this document)
```

---

## 8. Installation & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: v3.10 or higher
- **Package Managers**: `npm` (Node) and `pip` (Python)
- **Operating System**: Windows, macOS, or Linux

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/shakshijha06/RESQINTEL.git
cd RESQINTEL
```

---

### Step 2: Backend Setup & Execution
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure local backend environment:
   ```bash
   # Copy template to .env
   cp .env.example .env
   ```
5. *(Optional)* Seed the civic demonstration dataset:
   ```bash
   # Idempotent script: populates 80 civic reports, 30 incidents, and 18 review pairs
   python seed_demo_data.py
   ```
6. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *The backend will be available at `http://127.0.0.1:8000`. Interactive OpenAPI documentation is accessible at `http://127.0.0.1:8000/docs`.*

---

### Step 3: Frontend Setup & Execution
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Configure frontend environment variables:
   Create a local environment file `frontend/.env.local` (this file is excluded by `.gitignore`):
   ```env
   # TomTom Developer API Key (obtain free key from https://developer.tomtom.com/)
   VITE_TOMTOM_API_KEY=your_tomtom_api_key_here

   # Backend API URL
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The public portal will be live at `http://localhost:5173`.*

---

### Step 4: Accessing the Application
- **Public Citizen Portal**: `http://localhost:5173/`
- **Citizen Report Submission**: `http://localhost:5173/report`
- **Public Interactive Map**: `http://localhost:5173/map`
- **Citizen Report Tracking**: `http://localhost:5173/track`
- **Admin Operations Desk**: `http://localhost:5173/admin/login`
  - **Default Email**: `admin@resqintel.org`
  - **Default Password**: `set up a strong password` *(Configurable via backend `.env`)*

---

## 9. Environment Variables Reference

### Frontend Configuration (`frontend/.env.local`)
| Variable Name | Required | Description | Example Format |
| :--- | :---: | :--- | :--- |
| `VITE_TOMTOM_API_KEY` | Recommended | TomTom Developer API key enabling Map Display tiles, Places Search autocomplete, and Reverse Geocoding. *(Fallback mode active if omitted)*. | `sMC9PTrKqmtkSnJ6...` |
| `VITE_API_URL` | **Yes** | Fully qualified URL pointing to the FastAPI backend API prefix. | `http://127.0.0.1:8000/api` |

### Backend Configuration (`backend/.env`)
| Variable Name | Required | Description | Default / Example Format |
| :--- | :---: | :--- | :--- |
| `PORT` | No | Port on which the FastAPI ASGI server listens. | `8000` |
| `HOST` | No | Host address binding for FastAPI. | `0.0.0.0` |
| `STORAGE_BACKEND` | **Yes** | Repository storage mode (`json` or `mongodb`). | `json` |
| `JSON_DATA_DIR` | Conditional | Relative path to local JSON database folder. | `./data` |
| `MONGODB_URI` | Conditional | Connection URI for MongoDB Atlas when `STORAGE_BACKEND=mongodb`. | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `MONGODB_DB_NAME` | Conditional | Database name in MongoDB Atlas. | `resqintel` |
| `JWT_SECRET_KEY` | **Yes** | Secret cryptographic key used to sign HS256 JWT tokens. | `random-64-character-string` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime before re-authentication is required. | `120` |
| `BOOTSTRAP_ADMIN_EMAIL` | **Yes** | Email address for initial super-administrator account. | `admin@resqintel.org` |
| `BOOTSTRAP_ADMIN_PASSWORD` | **Yes** | Password for initial super-administrator account. | `Admin@ResQ2026!` |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for structured AI comparisons. | `AIzaSy...` |
| `GEMINI_MODEL` | No | Gemini model variant used for analytical comparisons. | `gemini-2.5-flash` |

---

## 10. REST API Directory

All backend endpoints are routed through the `/api` prefix.

### Public Endpoints (No Authentication Required)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and database diagnostics. |
| `POST` | `/api/public/reports` | Submit a citizen civic report with location and evidence. |
| `POST` | `/api/public/track` | Track a submitted report using reference ID and token. |
| `GET` | `/api/public/reports` | List published community reports (safe fields only). |
| `GET` | `/api/public/reports/{id}` | Retrieve individual published report profile. |
| `GET` | `/api/public/incidents` | List published municipal incidents with status and coordinates. |
| `GET` | `/api/public/incidents/{id}` | Retrieve published incident bulletin and progress updates. |

### Authentication & User Management
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate administrator and receive JWT token. |
| `GET` | `/api/auth/me` | Authenticated | Return profile of currently signed-in user. |
| `POST` | `/api/auth/change-password` | Authenticated | Change password for current account. |
| `GET` | `/api/admin/users` | Admin Only | List all operations team accounts. |
| `POST` | `/api/admin/users` | Admin Only | Create a new reviewer or administrator account. |
| `PATCH` | `/api/admin/users/{id}/status` | Admin Only | Activate or suspend an operations account. |

### Administrative Operations & Incident Management
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Reviewer / Admin | Real-time counts for reports, incidents, and reviews. |
| `GET` | `/api/admin/reports` | Reviewer / Admin | Paginated, filterable directory of all citizen reports. |
| `GET` | `/api/admin/reports/{id}` | Reviewer / Admin | Full operational report profile including verbatim text. |
| `GET` | `/api/admin/incidents` | Reviewer / Admin | Filterable list of grouped municipal incidents. |
| `GET` | `/api/admin/incidents/{id}` | Reviewer / Admin | Incident workspace with linked report objects. |
| `PATCH` | `/api/admin/incidents/{id}` | Reviewer / Admin | Update incident status, priority, department, or publish. |
| `GET` | `/api/admin/reviews` | Reviewer / Admin | List candidate pairs awaiting human verification. |
| `POST` | `/api/admin/reviews/{id}/decision` | Reviewer / Admin | Record review decision (`confirm_match`, `mark_non_match`). |
| `POST` | `/api/admin/reviews/{id}/ai-analysis` | Reviewer / Admin | Trigger Google Gemini 2.5 Flash structured comparison. |
| `GET` | `/api/admin/notifications` | Reviewer / Admin | List operational notifications. |
| `GET` | `/api/admin/audit-logs` | Admin Only | Paginated, tamper-evident security audit logs. |

---

## 11. Database & Persistence Design

The backend uses an abstracted Repository Pattern (`db_repo`) allowing seamless switching between local JSON files and MongoDB Atlas via the `STORAGE_BACKEND` environment variable.

### Stored Collections
1. **`reports`**: Preserves original citizen observations verbatim with coordinates, status, language, and supporting media payloads.
2. **`incidents`**: Represents unified municipal operations, containing grouped report ID references (`associated_report_ids`), department assignments, priority levels, and chronological action updates.
3. **`reviews`**: Stores candidate pairs surfaced by the reconciliation engine with distance, timing delta, category match, similarity scores, and reviewer decision history.
4. **`users`**: Contains operations credentials, roles (`admin`, `reviewer`), active status, and bcrypt password hashes.
5. **`submission_tracking`**: Stores one-way SHA-256 token hashes for public tracking without exposing sensitive contact details.
6. **`audit_logs`**: Append-only log recording timestamp, actor identity, action type, entity ID, and change details.
7. **`notifications`**: System alerts for incoming high-priority reports and completed triage actions.

---

## 12. Security & Privacy Architecture

- **Public Privacy Boundaries**:
  - The public API (`/api/public/*`) strictly redacts reporter names, phone numbers, email addresses, and internal notes.
  - Public coordinates are rounded to 4 decimal places where necessary to avoid pinpointing individual private residences.
- **Credential Protection**:
  - Passwords are never stored in plaintext; all credentials use bcrypt hashing with salted rounds.
  - The initial super-administrator is provisioned via environment variables on first startup and protected against duplicate instantiation.
- **Brute-Force Rate Limiting**:
  - The `/api/auth/login` endpoint enforces client IP and account-based rate limits with progressive lockout periods to prevent credential stuffing.
- **Token Integrity**:
  - Administrative sessions use signed HS256 JWT tokens with strict expiration.
  - Public report tracking relies on SHA-256 digests; the plaintext token is never stored in the database.
- **Zero API Key Leaks**:
  - All local environment files (`.env`, `.env.local`) are excluded in `.gitignore`.
  - Frontend diagnostic views display only masked credentials (`ab***12`).

---

## 13. Testing & Verification

The application includes an automated end-to-end Python test suite that verifies critical workflows against real backend services and database storage.

### Running the Test Suite
```bash
python backend/test_civic_platform.py
```

### Verified Test Suites
```text
RESQINTEL END-TO-END CIVIC PLATFORM VERIFICATION
[PASS] 1. Admin Authentication: Logged in as admin@resqintel.org (role: admin)
[PASS] 2. Public Report Intake: Generated ID 'RPT-2026-0161' with status 'under_review'
[PASS] 3. Automatic Incident Linking: Report linked to incident 'INC-64CC68'
[PASS] 4. Incident Integrity: Report count strictly matches actual linked reports
[PASS] 5. Citizen Tracking: Verified report status 'under_review' via reference ID
[PASS] 6. Admin Incident Workflow: Set status='in_progress', priority='high', dept dispatch
[PASS] 7. Public Privacy Boundaries: Sensitive metadata properly redacted in public view
[PASS] 8. Reconciliation Engine: Haversine distance=1.28km, Text similarity validation
[PASS] 9. Dashboard Analytics: Real-time aggregation from persistent JSON storage

ALL 9 CORE WORKFLOW SUITES PASSED WITH ZERO ERRORS.
```

---

## 14. Current Limitations

- **SMS / WhatsApp Gateway**: Citizen notifications currently rely on web-based reference tracking. Direct SMS or WhatsApp push dispatch is planned for future phases.
- **Offline PWA Caching**: While the platform functions seamlessly on mobile web browsers, offline caching of TomTom map tiles is currently limited by browser cache constraints.
- **Language Detection**: While submissions support Hindi, Bengali, and English, automated multilingual semantic reconciliation currently normalizes to English text prior to comparison.

---

## 15. Future Scope

1. **Automated WhatsApp Citizen Bot**: Integration with WhatsApp Business API allowing citizens to submit geo-tagged photos and receive resolution updates directly in messaging apps.
2. **Municipal Work-Order Integration**: Direct API connectors to municipal enterprise ERPs (e.g., SAP, civic work-order dispatch systems).
3. **Computer Vision Damage Assessment**: Client-side automated severity classification for road potholes and structural cracks using lightweight TensorFlow.js models.
4. **Predictive Recurrence Analytics**: Machine learning forecasting to identify civic infrastructure vulnerable to repeated failure during seasonal rainfall.

---

## 16. Academic & Project Information

- **Institution**: Department of Computer Science and Engineering, University of Engineering & Management, Kolkata
- **Degree**: Bachelor of Technology (B.Tech) in Computer Science and Engineering
- **Project Title**: ResQIntel — Civic Issue Reporting, Incident Intelligence & Resolution Platform
- **Project Members**: `[Candidate Roll Numbers / Names Placeholder]`
- **Project Supervisor**: `[Supervisor / Faculty Guide Name Placeholder]`
- **Academic Session**: `2025 – 2026`

---

## 17. License

This project is licensed under the terms of the MIT License. See `LICENSE` for details.
