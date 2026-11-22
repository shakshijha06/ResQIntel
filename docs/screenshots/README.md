# ResQIntel Visual Demonstration Asset Registry

This directory contains visual captures and reference specifications for the ResQIntel platform. Each screenshot corresponds to a documented figure in the formal academic report (`PROJECT_REPORT.md` / `PROJECT_REPORT.docx`) and the project `README.md`.

---

## Screenshot Inventory & Capture Checklist

| Figure ID | Target Page & Route | Access Role | Focus Elements to Capture | Mapped Document Section |
| :--- | :--- | :--- | :--- | :--- |
| **Figure 5.1** | Public Homepage (`/`) | Public Guest | Hero banner, live operational counters bar, civic categories grid, and emergency 112 notice banner. | Chapter 5.6 / README Visuals |
| **Figure 5.2** | Report Submission (`/report`) | Public Citizen | Issue classification dropdown, observation description, direct photo upload dropzone, and reporter privacy options. | Chapter 5.6 / README Visuals |
| **Figure 5.3** | TomTom Location Picker (`/report`) | Public Citizen | Street-level TomTom map, live places search autocomplete dropdown, "Use My Location" GPS button, and draggable pin. | Chapter 5.6 / README Visuals |
| **Figure 5.4** | Submission Confirmation (`/report`) | Public Citizen | Success panel displaying unique reference code (e.g., `RPT-2026-0160`) and "Track My Report" navigation button. | Chapter 5.6 / README Visuals |
| **Figure 5.5** | Public Reports Explorer (`/reports`) | Public Guest | Filterable list of community dispatches, category badges, location tags, and individual report profile buttons. | Chapter 5.6 / README Visuals |
| **Figure 5.6** | Public Civic Map (`/map`) | Public Guest | Full-screen TomTom interactive map, synchronized issue sidebar, priority-coded markers, and incident summary popups. | Chapter 5.6 / README Visuals |
| **Figure 5.7** | Incident Bulletin View (`/incident/:id`) | Public Guest | Grouped incident overview, verified report count, department dispatch status, and progress timeline. | Chapter 5.6 / README Visuals |
| **Figure 5.8** | Citizen Tracking Portal (`/track`) | Public Citizen | Reference code tracking input, current triage state badge, and status explanation card. | Chapter 5.6 / README Visuals |
| **Figure 5.9** | Admin Operations Dashboard (`/admin/dashboard`) | Administrator | Real-time statistics grid, review queue priority card, monitoring directive, and recent incidents table. | Chapter 5.6 / README Visuals |
| **Figure 5.10** | Triage & Review Centre (`/admin/reviews`) | Administrator | Left-hand candidate pair queue, verbatim side-by-side report comparison, similarity indicators, and decision buttons. | Chapter 5.6 / README Visuals |
| **Figure 5.11** | Incident Management Workspace (`/admin/incidents/:id`) | Administrator | Operational incident editor, department dispatch dropdown, progress update logger, and associated report list. | Chapter 5.6 / README Visuals |
| **Figure 5.12** | Geospatial Incident Explorer (`/admin/map`) | Administrator | Operational command canvas with TomTom street tiles, cluster filters, GPS pin highlights, and quick focus drawer. | Chapter 5.6 / README Visuals |

---

## Capture Technical Guidelines

1. **Resolution**: Standard 1920×1080 (1080p) or 1440×900 desktop viewport.
2. **Color Profile**: sRGB, PNG format for sharp text and crisp map lines.
3. **Naming Convention**: `fig_5_1_homepage.png`, `fig_5_2_reporting_form.png`, `fig_5_3_tomtom_picker.png`, etc.
4. **Data Integrity**: Capture real records from `reports.json` and `incidents.json` without blurring operational identifiers.
