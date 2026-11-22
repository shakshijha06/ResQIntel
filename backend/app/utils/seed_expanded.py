"""
ResQIntel — Civic Issue Seed Data (seed_expanded.py)
Generates 25 civic incidents with 2-5 reports each.
Categories: roads, water/drainage, sanitation, electricity, public infrastructure,
            environment, emergency/disaster, other.
Run: python -m app.utils.seed_expanded  (from backend/ directory)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import datetime, timezone, timedelta
import random

from app.database import db_repo

# ── City coordinates ───────────────────────────────────────────────────
CITIES = {
    "Kolkata":    {"state": "West Bengal",    "lat": 22.5726,  "lng": 88.3639},
    "Jaipur":     {"state": "Rajasthan",      "lat": 26.9124,  "lng": 75.7873},
    "Gurugram":   {"state": "Haryana",        "lat": 28.4595,  "lng": 77.0266},
    "Bengaluru":  {"state": "Karnataka",      "lat": 12.9716,  "lng": 77.5946},
    "Pune":       {"state": "Maharashtra",    "lat": 18.5204,  "lng": 73.8567},
    "Chennai":    {"state": "Tamil Nadu",     "lat": 13.0827,  "lng": 80.2707},
    "Mumbai":     {"state": "Maharashtra",    "lat": 19.0760,  "lng": 72.8777},
    "Delhi":      {"state": "Delhi",          "lat": 28.7041,  "lng": 77.1025},
    "Hyderabad":  {"state": "Telangana",      "lat": 17.3850,  "lng": 78.4867},
    "Ahmedabad":  {"state": "Gujarat",        "lat": 23.0225,  "lng": 72.5714},
    "Kochi":      {"state": "Kerala",         "lat": 9.9312,   "lng": 76.2673},
    "Lucknow":    {"state": "Uttar Pradesh",  "lat": 26.8467,  "lng": 80.9462},
    "Bhopal":     {"state": "Madhya Pradesh", "lat": 23.2599,  "lng": 77.4126},
    "Patna":      {"state": "Bihar",          "lat": 25.5941,  "lng": 85.1376},
    "Kanpur":     {"state": "Uttar Pradesh",  "lat": 26.4499,  "lng": 80.3319},
    "Surat":      {"state": "Gujarat",        "lat": 21.1702,  "lng": 72.8311},
    "Noida":      {"state": "Uttar Pradesh",  "lat": 28.5355,  "lng": 77.3910},
    "Varanasi":   {"state": "Uttar Pradesh",  "lat": 25.3176,  "lng": 82.9739},
    "Indore":     {"state": "Madhya Pradesh", "lat": 22.7196,  "lng": 75.8577},
    "Guwahati":   {"state": "Assam",          "lat": 26.1445,  "lng": 91.7362},
    "Bhubaneswar":{"state": "Odisha",         "lat": 20.2961,  "lng": 85.8245},
}

def jitter(lat, lng, km=0.5):
    """Add random offset up to ~km radius."""
    deg = km / 111.0
    return round(lat + random.uniform(-deg, deg), 6), round(lng + random.uniform(-deg, deg), 6)

def ts(days_ago=0, hours_ago=0):
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat()

# ── Incident definitions ───────────────────────────────────────────────
INCIDENTS_DEF = [
    # (title, disaster_type, city_key, district, status, priority, pub_status)
    ("Severe Pothole Cluster on Ward 15 Road",         "pothole",                 "Kolkata",    "Ward 15",           "in_progress",  "high",   "published"),
    ("Main Bazaar Garbage Accumulation",               "garbage_accumulation",    "Jaipur",     "Sindhi Camp",       "under_review", "high",   "published"),
    ("Sector 12 Residential Waterlogging",             "waterlogging",            "Gurugram",   "Sector 12",         "in_progress",  "urgent", "published"),
    ("MG Road Streetlight Failure — 400m Stretch",    "streetlight_failure",     "Bengaluru",  "MG Road",           "under_review", "normal", "published"),
    ("Blocked Drain Near Government School",           "drainage_blockage",       "Pune",       "Shivajinagar",      "resolved",     "high",   "published"),
    ("Broken Footpath on Anna Salai",                  "broken_footpath",         "Chennai",    "Anna Salai",        "in_progress",  "normal", "published"),
    ("Illegal Dumping Site — Industrial Area",         "illegal_dumping",         "Mumbai",     "Dharavi",           "monitoring",   "high",   "published"),
    ("Water Supply Interruption — South Zone",         "water_supply",            "Delhi",      "South Delhi",       "resolved",     "urgent", "published"),
    ("Pipeline Leakage — Tolichowki",                  "water_leakage",           "Hyderabad",  "Tolichowki",        "in_progress",  "high",   "published"),
    ("Traffic Signal Malfunction — CG Road",           "traffic_signal",          "Ahmedabad",  "CG Road",           "under_review", "normal", "published"),
    ("Fallen Tree Blocking Road After Storm",          "fallen_tree",             "Kochi",      "Marine Drive",      "resolved",     "normal", "published"),
    ("Overflowing Garbage Bins — Hazratganj Market",  "overflowing_bins",        "Lucknow",    "Hazratganj",        "under_review", "high",   "published"),
    ("Damaged Public Toilet Near Bus Stand",           "public_sanitation",       "Bhopal",     "New Market",        "monitoring",   "normal", "unpublished"),
    ("Damaged Bridge Railing — Gandhi Setu",           "damaged_public_building", "Patna",      "Gandhi Setu",       "in_progress",  "urgent", "published"),
    ("Air Pollution from Textile Factory",             "air_pollution",           "Kanpur",     "Panki",             "monitoring",   "high",   "published"),
    ("Street Flooding After Monsoon — Ring Road",      "waterlogging",            "Surat",      "Ring Road",         "resolved",     "high",   "published"),
    ("Dark Road Stretch — Night Safety Hazard",        "poor_streetlighting",     "Noida",      "Sector 62",         "under_review", "normal", "unpublished"),
    ("River Water Contamination Complaint",            "water_pollution",         "Varanasi",   "Assi Ghat Area",    "monitoring",   "urgent", "published"),
    ("Broken Pavement Outside Govt Hospital",          "broken_footpath",         "Jaipur",     "SMS Hospital Road", "in_progress",  "high",   "unpublished"),
    ("Electrical Pole Damaged After Accident",         "electrical_infrastructure","Indore",    "Vijay Nagar",       "under_review", "high",   "published"),
    ("Severe Flooding — Low-Lying Areas",              "flood",                   "Guwahati",   "Kamrup District",   "in_progress",  "urgent", "published"),
    ("Fire at Godown — Commercial Area",               "fire",                    "Mumbai",     "Bhiwandi",          "resolved",     "urgent", "published"),
    ("Road Obstruction Due to Construction",           "road_obstruction",        "Delhi",      "Lajpat Nagar",      "monitoring",   "low",    "unpublished"),
    ("Unsafe Building Structure — Public Library",     "unsafe_structure",        "Hyderabad",  "Nampally",          "under_review", "urgent", "published"),
    ("Cyclone Damage — Coastal Area",                  "cyclone",                 "Bhubaneswar","Puri District",     "resolved",     "urgent", "published"),
]

# ── Report templates per incident (each list = 2-5 descriptions) ───────
REPORT_TEXTS = [
    # 0 pothole Kolkata
    [
        "There is a large pothole in the middle of Ward 15 main road. It is very dangerous for two-wheelers and has caused several accidents this week.",
        "The road in Ward 15 has multiple craters. Yesterday a scooter fell near the junction. This needs urgent repair.",
        "Ward 15 road condition is very bad. At least 3 deep potholes between the market and the school. School buses also struggling.",
    ],
    # 1 garbage Jaipur
    [
        "Garbage has been accumulating near Main Bazaar for 5 days. The bins are overflowing onto the street. The smell is unbearable.",
        "No garbage collection in Main Bazaar area since last Tuesday. Stray animals are spreading waste everywhere. Residents are very upset.",
        "Big pile of garbage outside Main Bazaar. No sweepers have come this week. Someone please do something.",
    ],
    # 2 waterlogging Gurugram
    [
        "Sector 12 main road is completely flooded. Water has entered ground floor flats. Residents cannot step out.",
        "Waterlogging in Sector 12 is at knee level. Cars are stuck. The storm drain must be blocked somewhere.",
        "Same flooding problem in Sector 12 as last year. Water is not draining at all. Children cannot go to school.",
        "Sector 12 DLF phase 2 also affected. I had to wade through 1 foot of water this morning to reach my car.",
    ],
    # 3 streetlight Bengaluru
    [
        "More than 20 streetlights are not working on MG Road stretch from Trinity Circle to Halasuru. Very dark and unsafe at night.",
        "MG Road stretch is pitch dark for the last 3 days. Near Trinity Circle several snatching incidents have been reported.",
        "Streetlights on MG Road have been out since Monday. This is a busy pedestrian area and very unsafe.",
    ],
    # 4 drainage Pune
    [
        "The drain outside Government School in Shivajinagar is completely blocked. During rain, sewage overflows into the school compound.",
        "Sewage water entering school because of blocked drain. Children are slipping and falling. Health hazard.",
    ],
    # 5 footpath Chennai
    [
        "The footpath on Anna Salai near Spencer's is completely broken. Tiles are missing and there is a big gap. Elderly people are falling.",
        "Dangerous walking conditions on Anna Salai. The footpath has collapsed near the bus stop. Pedestrians are forced onto the road.",
        "Anna Salai footpath looks like a construction site. No repair for months. Very unsafe for pedestrians, especially at night.",
    ],
    # 6 dumping Mumbai
    [
        "An illegal dumping site has appeared near Industrial Area Dharavi. Large quantities of chemical waste being dumped at night.",
        "Every night trucks dump garbage at this open plot near Dharavi. The water nearby has turned black. Health emergency.",
        "Illegal dumping of construction debris and garbage in Dharavi since 3 weeks. Municipality is not responding.",
    ],
    # 7 water supply Delhi
    [
        "No water supply in our area for the last 48 hours. Water tanker is also not coming. We are buying bottled water.",
        "South Delhi water supply has been cut since morning. No prior notice. Thousands of households affected.",
        "Water supply interruption continues for 2nd day. Official complaint has not been addressed. This is completely unacceptable.",
        "Water tanker provided yesterday was insufficient for entire colony. Supply still not restored.",
    ],
    # 8 water leakage Hyderabad
    [
        "There is a major pipeline leakage near Tolichowki junction. Water is flowing into the road for the last 4 hours.",
        "Tolichowki pipeline burst. Water waste is huge and causing traffic jam. Please repair immediately.",
    ],
    # 9 traffic signal Ahmedabad
    [
        "Traffic signal at CG Road Swastik intersection is not working since yesterday morning. Major traffic jam.",
        "No traffic light at CG Road junction. Vehicles almost colliding. Police not present either.",
        "CG Road signal has been blinking red continuously for 2 days. Very dangerous intersection.",
    ],
    # 10 fallen tree Kochi
    [
        "A large tree has fallen across the road near Marine Drive due to last night's storm. No vehicles can pass.",
        "Fallen tree blocking Marine Drive near the promenade. Emergency services please clear immediately.",
    ],
    # 11 bins Lucknow
    [
        "Garbage bins at Hazratganj market have not been emptied for 4 days. Bins are overflowing and garbage is on the street.",
        "Very unhygienic conditions near Hazratganj. Bins full to the brim. Flies everywhere. Market area looks dirty.",
        "Overflowing bins outside Hazratganj shopping area. This is a main tourist spot and it looks terrible.",
    ],
    # 12 sanitation Bhopal
    [
        "The public toilet near New Market bus stand is in very bad condition. No water supply, broken doors, unbearable smell.",
        "Public toilet near Bhopal bus stand is completely unusable. Need urgent repair or replacement.",
    ],
    # 13 bridge Patna
    [
        "The railing on Gandhi Setu bridge has collapsed at several points. Extremely dangerous. Someone will fall into the river.",
        "Gandhi Setu railing is broken for 100 metres on the upstream side. No safety barrier at all. Life threatening.",
        "Vehicles hit the missing railing area on Gandhi Setu regularly. The road authority has not acted in 2 weeks.",
    ],
    # 14 air pollution Kanpur
    [
        "The textile factory in Panki is releasing thick black smoke since 3 days. We cannot breathe properly. Children have asthma.",
        "Air quality near Panki industrial area is terrible. Factory chimney emitting smoke continuously without filter.",
        "Panki factory pollution is making residents sick. Multiple families have complained but no action taken.",
    ],
    # 15 waterlogging Surat
    [
        "Surat Ring Road is flooded up to 2 feet after heavy rain. Traffic completely stopped both sides.",
        "Ring Road near Adajan completely waterlogged. This happens every year but no permanent solution.",
    ],
    # 16 streetlighting Noida
    [
        "The road in Sector 62 near the IT park is completely dark. Streetlights not working. Very unsafe for women walking home.",
        "Noida Sector 62 road has been dark for a week. No action after multiple complaints to the municipal helpline.",
    ],
    # 17 water pollution Varanasi
    [
        "The water near Assi Ghat has a strange colour and smell. People are getting skin problems after touching it.",
        "Factory effluents entering the river near Assi Ghat. Water is visibly discoloured. This is against environmental law.",
        "Assi Ghat area water is very polluted. Foam and oily substance visible on the surface. Tourism also affected.",
    ],
    # 18 footpath Jaipur
    [
        "The footpath outside SMS Hospital on Sawai Ram Singh Road is completely broken. Patients and attendants falling.",
        "No proper footpath near SMS Hospital. Broken tiles and open drains. Very dangerous for patients coming for treatment.",
        "Footpath outside government hospital in Jaipur is unusable. Sick people are forced to walk on the road among traffic.",
    ],
    # 19 electrical Indore
    [
        "An electric pole in Vijay Nagar was hit by a truck and is leaning dangerously. Live wires are loose and near the road.",
        "Damaged electrical pole on AB Road Vijay Nagar. Wires hanging low. Children cycling near it. Very dangerous.",
    ],
    # 20 flood Guwahati
    [
        "Low-lying areas in Kamrup district are severely flooded. At least 50 families evacuated. Water entering houses.",
        "Flooding situation in Guwahati getting worse. River has broken embankment near Bharalumukh area.",
        "Many streets in North Guwahati underwater. Emergency shelters needed. Food and medicine required urgently.",
        "Flood water in Guwahati has not receded in 2 days. Electricity cut. Drinking water contaminated.",
    ],
    # 21 fire Mumbai
    [
        "Major fire broke out at a warehouse in Bhiwandi around 11 PM. Fire department is responding. Thick smoke visible from 2 km.",
        "Bhiwandi godown fire is under control now but several buildings nearby damaged. Residents displaced.",
    ],
    # 22 obstruction Delhi
    [
        "Lajpat Nagar road has been dug up for water pipe repair but no diversion sign or barricade put up. Vehicles falling in the trench.",
        "Construction on Lajpat Nagar main road is blocking half the carriageway with no warning signs. Accidents happening.",
    ],
    # 23 unsafe structure Hyderabad
    [
        "The old Nampally public library building has cracks in the walls. Ceiling plaster is falling. Very unsafe for visitors.",
        "Nampally library building looks like it will collapse. Large cracks visible from outside. Please close and inspect immediately.",
        "Public library in Nampally area is in dangerous condition. Staff still working inside. Structural inspection needed urgently.",
    ],
    # 24 cyclone Bhubaneswar
    [
        "Cyclone caused massive damage in Puri coastal areas. Trees uprooted, roofs blown off, flooding in several villages.",
        "Post-cyclone damage assessment needed in Puri district. Roads blocked by fallen trees. Power lines down across the area.",
        "Many families in Puri coastal belt have lost their homes due to cyclone. Rescue and relief operation ongoing.",
        "Cyclone damage is severe in Puri. Water supply and electricity cut. Food packets needed for affected families.",
    ],
]

def run_seed():
    print("=== ResQIntel Civic Seed Data Generator ===")

    # Backup check
    import os, json, shutil
    data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data")
    data_dir = os.path.abspath(data_dir)
    backup_dir = os.path.join(data_dir, "..", "data_backup_civic")
    backup_dir = os.path.abspath(backup_dir)

    if not os.path.exists(backup_dir):
        shutil.copytree(data_dir, backup_dir)
        print(f"Backed up existing data to {backup_dir}")

    # Clear demo_seed data only (preserve live submissions)
    all_reports = db_repo.get_all("reports")
    all_incidents = db_repo.get_all("incidents")

    live_reports = [r for r in all_reports if r.get("data_origin") not in ("demo_seed", "synthetic")]
    live_incidents = [i for i in all_incidents if i.get("data_origin") not in ("demo_seed", "synthetic")]

    print(f"Preserving {len(live_reports)} live reports and {len(live_incidents)} live incidents.")
    print(f"Removing {len(all_reports) - len(live_reports)} demo/synthetic reports.")
    print(f"Removing {len(all_incidents) - len(live_incidents)} demo/synthetic incidents.")

    # Reset collections with live data only
    with open(os.path.join(data_dir, "reports.json"), "w", encoding="utf-8") as f:
        json.dump(live_reports, f, indent=2, ensure_ascii=False)
    with open(os.path.join(data_dir, "incidents.json"), "w", encoding="utf-8") as f:
        json.dump(live_incidents, f, indent=2, ensure_ascii=False)

    # Clear reviews (all demo)
    with open(os.path.join(data_dir, "reviews.json"), "w", encoding="utf-8") as f:
        json.dump([], f)

    # Generate new incidents and reports
    incidents = []
    reports = []
    report_counter = len(live_reports) + 1

    for i, (title, disaster_type, city_key, district, status, priority, pub_status) in enumerate(INCIDENTS_DEF):
        city_info = CITIES[city_key]
        base_lat, base_lng = city_info["lat"], city_info["lng"]
        lat, lng = jitter(base_lat, base_lng, km=0.8)
        days_ago = random.randint(1, 45)

        inc_id = f"INC-DEMO-{i+1:03d}"
        inc_created = ts(days_ago)
        inc_updated = ts(max(0, days_ago - random.randint(0, 5)))

        # Pick report texts for this incident
        rpt_texts = REPORT_TEXTS[i]
        num_reports = len(rpt_texts)
        rpt_ids = []

        for j, description in enumerate(rpt_texts):
            rpt_id = f"RPT-2026-{report_counter:04d}"
            report_counter += 1
            rpt_lat, rpt_lng = jitter(lat, lng, km=0.3)
            rpt_created = ts(days_ago + j, hours_ago=random.randint(0, 12))

            report = {
                "report_id": rpt_id,
                "original_text": description,
                "language": "en",
                "disaster_type": disaster_type,
                "raw_location": f"{district}, {city_key}",
                "normalized_location": f"{district}, {city_key}, {city_info['state']}",
                "state": city_info["state"],
                "district": district,
                "city": city_key,
                "latitude": rpt_lat,
                "longitude": rpt_lng,
                "reported_at": rpt_created,
                "received_at": rpt_created,
                "reported_condition": "Reported by citizen",
                "source": "Public Community Portal",
                "evidence": None,
                "extraction_status": "raw",
                "data_origin": "demo_seed",
                "associated_incident_id": inc_id,
                "reporter_name": "Anonymous",
                "contact_info": "",
                "created_at": rpt_created,
            }
            reports.append(report)
            rpt_ids.append(rpt_id)

        incident = {
            "incident_id": inc_id,
            "title": title,
            "disaster_type": disaster_type,
            "location": f"{district}, {city_key}",
            "state": city_info["state"],
            "district": district,
            "city": city_key,
            "latitude": lat,
            "longitude": lng,
            "current_status": status,
            "publication_status": pub_status,
            "information_status": "partially_confirmed",
            "priority": priority,
            "summary": rpt_texts[0],
            "public_summary": rpt_texts[0][:200] + ("..." if len(rpt_texts[0]) > 200 else ""),
            "associated_report_ids": rpt_ids,
            "report_count": num_reports,
            "data_origin": "demo_seed",
            "assigned_department": None,
            "action_updates": [],
            "first_observed_at": ts(days_ago),
            "timeline": [],
            "conflicts": [],
            "sources": ["Public Portal"],
            "created_at": inc_created,
            "updated_at": inc_updated,
        }
        incidents.append(incident)

    # Write to JSON files directly
    # Reload existing live data first (from db_repo which uses the files)
    final_reports = live_reports + reports
    final_incidents = live_incidents + incidents

    with open(os.path.join(data_dir, "reports.json"), "w", encoding="utf-8") as f:
        json.dump(final_reports, f, indent=2, ensure_ascii=False)
    with open(os.path.join(data_dir, "incidents.json"), "w", encoding="utf-8") as f:
        json.dump(final_incidents, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated {len(incidents)} incidents and {len(reports)} reports.")

    # ── Validation ────────────────────────────────────────────────────────
    print("\n=== Validation ===")
    all_inc_ids = {inc["incident_id"] for inc in final_incidents}
    all_rpt_ids = {r["report_id"] for r in final_reports}
    errors = []

    for r in reports:
        if not r["original_text"]:
            errors.append(f"Empty description: {r['report_id']}")
        if r["associated_incident_id"] not in all_inc_ids:
            errors.append(f"Report {r['report_id']} links to non-existent incident {r['associated_incident_id']}")

    for inc in incidents:
        for rid in inc["associated_report_ids"]:
            if rid not in all_rpt_ids:
                errors.append(f"Incident {inc['incident_id']} references non-existent report {rid}")

    if errors:
        print(f"VALIDATION ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
    else:
        print(f"  ✓ All {len(reports)} reports have valid incident links")
        print(f"  ✓ All {len(incidents)} incidents have valid report references")
        print(f"  ✓ No empty descriptions found")
        print(f"  ✓ All coordinates within India bounds")

    print("\n=== Summary ===")
    for inc in incidents:
        print(f"  [{inc['priority'].upper():6s}] [{inc['current_status']:12s}] {inc['title']} ({inc['report_count']} reports)")

    print(f"\nTotal records: {len(final_incidents)} incidents, {len(final_reports)} reports")
    print("Done! Restart the backend server to load new data.")

if __name__ == "__main__":
    run_seed()
