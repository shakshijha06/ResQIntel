# ResQIntel | Emergency Information Intelligence Platform
## Complete Architecture & Operational Documentation

---

## 🏛️ 1. Architecture Overview & Dual Experience

ResQIntel is built with two distinct user experiences sharing a unified FastAPI backend and data storage model:

```
                                  ┌──────────────────────────────┐
                                  │      ResQIntel Client        │
                                  └──────────────┬───────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
             Public Citizen Portal                           Admin Operations Workspace
           (No account required)                          (Role-Based: Admin / Reviewer)
           • / (Landing page)                             • /admin/login
           • /explore (Published incidents)               • /admin/dashboard (Real statistics)
           • /report (Public intake)                      • /admin/incidents & /:id
           • /track (Secure tracking)                     • /admin/reports (Multilingual dispatches)
           • /incident/:id (Public bulletin)              • /admin/map (Geospatial intelligence)
           • /about (Methodology & Ethics)                • /admin/reviews (Side-by-side reconciliation)
                                                          • /admin/settings (User & account security)
                        │                                                 │
                        └────────────────────────┬────────────────────────┘
                                                 │ REST API (/api)
                                                 ▼
                                   ┌───────────────────────────┐
                                   │      FastAPI Backend      │
                                   │   (Python 3.13 + Pydantic)│
                                   └─────────────┬─────────────┘
                                                 │
                         ┌───────────────────────┴───────────────────────┐
                         ▼                                               ▼
            Repository Abstraction Layer                      Google Gemini 2.5 Flash
        (BaseRepository: Mongo / JSON Store)                (Direct Structured Extraction)
```

---

## 🔐 2. Authentication & Authorization Details

- **Password Hashing:** `bcrypt` with salt rounds. Plaintext passwords or hashes are never returned or logged.
- **Tokens:** Short-lived `PyJWT` bearer access tokens (configurable `ACCESS_TOKEN_EXPIRE_MINUTES = 120`).
- **Initial Bootstrap Admin Account:**
  - **Email:** `admin@resqintel.org`
  - **Password:** `Admin@ResQ2026!`
  - **Role:** `admin`
- **Role Hierarchy:**
  - **ADMIN:** Full operational control; manage user accounts, publish/unpublish bulletins, resolve reviews, update cluster metadata.
  - **REVIEWER:** Inspect reports and review queues, compare dispatches, submit candidate match decisions and notes.
  - **PUBLIC VISITOR:** Submit observations anonymously, track reports via SHA-256 tokens, explore published bulletins.
- **Public Submission Security:**
  - Generates a reference ID (`RSQ-XXXXXX`) and a 32-character tracking token.
  - Only the SHA-256 hash of the tracking token is stored in the database.
  - Personal contact info is masked and never exposed to the public.

---

## 📊 3. Database & Dataset Diversity

- **Storage Layer:** Abstracted `BaseRepository` with `MongoRepository` (Atlas) and `JsonFileRepository` (`backend/data/*.json`).
- **Incidents Count:** **25 distinct real-world incidents** across 10 Indian states (Assam, Odisha, West Bengal, Uttarakhand, Karnataka, Maharashtra, Haryana, Kerala, Jammu & Kashmir, Rajasthan, Himachal Pradesh).
- **Reports Count:** **170 dispatches** pre-seeded across **English (85), Hindi (54), and Bengali (31)**.
- **Independent Events per Category:** Multiple distinct incidents exist within the same disaster type (e.g. Floods in Majuli vs Cuttack vs Supaul; Landslides in Dharasu vs Munnar vs Baramulla vs Koraput).
- **Audit Trails & Notifications:** All reviewer decisions, status updates, and new submissions generate real notifications in `AdminTopbar`.

---

## 🤖 4. Google Gemini 2.5 Flash Integration

- Configured using official endpoint `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.
- Utilizes `GEMINI_API_KEY` from backend environment (`gemini-2.5-flash`).
- Directly extracts structured entities (disaster category, subcategory, named landmarks, Indian state, district, city, reported conditions, severity indicators, and named entities) from multilingual reports.
- Tested and verified on original vernacular text (English, Hindi, Bengali).

---

## 🗺️ 5. Map Implementation & Geocoding

- **Mapping SDK:** Leaflet and React-Leaflet with customized pulsing coral markers.
- **Tile Provider:** Legitimate CartoDB Voyager tiles (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`) with OpenStreetMap data compliance.
- **No false API key dependencies:** Renders coordinates stored with incidents without external paid billing blockers.

---

## 🌐 6. Language & Localization (i18n)

- **Interface Language:** English (`en`), Hindi (`hi`), Bengali (`bn`) supported across headers, footers, buttons, and navigation. Persisted across page refreshes via `localStorage`.
- **Report Language Filtering:** Operates independently of the interface language, allowing operators to filter dispatches by their original language.

---

## 🚀 7. Running the Platform Locally

### 1. Start the FastAPI Backend
```powershell
$env:PYTHONPATH="backend"
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API documentation: `http://127.0.0.1:8000/docs`*

### 2. Start the React Frontend
```bash
cd frontend
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 📋 8. Verification & Automated Test Results

| Test Category | Target / Query | Status | Details |
| :--- | :--- | :--- | :--- |
| **Authentication** | `admin@resqintel.org` + correct password | **PASSED** | JWT token issued; user identity verified |
| **Auth Rejection** | Wrong password | **PASSED** | Rejected with HTTP 401 Unauthorized |
| **Public Report Intake** | Submit observation via `/api/public/reports` | **PASSED** | Ref `RSQ-XXXXXX` and 32-char token generated |
| **Secure Tracking** | Query `/api/public/track` with hash matching | **PASSED** | Status returned without private data leakage |
| **Public Visibility Guard** | Check published vs draft incidents | **PASSED** | Only approved incidents returned to public |
| **Active Landslides in Odisha** | Multi-filter: `landslide`, `active`, `Odisha` | **PASSED** | Returned Koraput Ghat Road Slope Failure |
| **Landslides in Uttarakhand** | Multi-filter: `landslide`, `Uttarakhand` | **PASSED** | Returned NH-108 Dharasu Rockfall |
| **Earthquake Clusters** | Filter: `earthquake` | **PASSED** | Returned Jhajjar (NCR) and Chamoli incidents |
| **Review Resolution** | Analyst decision submission & audit log | **PASSED** | Persisted decision, audit log, and notification |
| **Frontend Production Build** | `npm run build` | **PASSED** | 0 lint or bundle errors; production assets built |
