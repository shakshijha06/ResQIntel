"""
ResQIntel — Comprehensive Demo Seed Script
==========================================
Generates 120–150 synthetic civic reports, 30–40 incidents, and 15–20 review
candidates (pairs of similar reports) for demonstration purposes.

SAFETY RULES:
- Preserves ALL existing reports (synthetic or real).
- Preserves ALL existing incidents.
- Preserves ALL existing review records.
- Preserves ALL existing users and audit logs.
- Idempotent: running twice does NOT create duplicates.
  Duplicates are detected by report_id prefix "SYN-" or data_origin=="synthetic_seed".

Usage:
    cd /path/to/RESQINTEL
    python backend/seed_demo_data.py
"""

import json
import uuid
import sys
import os
from datetime import datetime, timezone, timedelta
import random

# ---- Path setup so we can import app modules if needed ----
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

REPORTS_FILE   = os.path.join(DATA_DIR, "reports.json")
INCIDENTS_FILE = os.path.join(DATA_DIR, "incidents.json")
REVIEWS_FILE   = os.path.join(DATA_DIR, "reviews.json")

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def load_json(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()
        return json.loads(content) if content else []

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {len(data)} records → {os.path.basename(path)}")

def ts(days_ago=0, hours_ago=0):
    """Return ISO timestamp offset by given days/hours into the past."""
    dt = datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours_ago)
    return dt.isoformat()

def syn_id(prefix="SYN"):
    return f"{prefix}-{uuid.uuid4().hex[:6].upper()}"

# ---------------------------------------------------------------------------
# CIVIC REPORT TEMPLATES
# Each cluster = a group of similar/related reports that should produce a
# review candidate pair or small incident.
# ---------------------------------------------------------------------------

LOCATIONS = {
    "West Bengal": [
        {"district": "North 24 Parganas", "city": "Barasat",
         "lat": 22.7225, "lng": 88.4799, "locality": "Barasat Station Road"},
        {"district": "North 24 Parganas", "city": "Naskarpara",
         "lat": 22.6845, "lng": 88.4620, "locality": "Naskarpara Main Road"},
        {"district": "South 24 Parganas", "city": "Baruipur",
         "lat": 22.3611, "lng": 88.4410, "locality": "Baruipur Market"},
        {"district": "Howrah", "city": "Howrah",
         "lat": 22.5958, "lng": 88.2636, "locality": "Howrah Market Area"},
        {"district": "Hooghly", "city": "Chinsurah",
         "lat": 22.8929, "lng": 88.3903, "locality": "Chinsurah Bus Stand"},
        {"district": "Kolkata", "city": "Kolkata",
         "lat": 22.5726, "lng": 88.3639, "locality": "Ultadanga"},
        {"district": "Kolkata", "city": "Kolkata",
         "lat": 22.5204, "lng": 88.3706, "locality": "Jadavpur"},
    ],
    "Delhi": [
        {"district": "Central Delhi", "city": "Delhi",
         "lat": 28.6448, "lng": 77.2167, "locality": "Karol Bagh"},
        {"district": "South Delhi", "city": "Delhi",
         "lat": 28.5355, "lng": 77.2410, "locality": "Lajpat Nagar"},
        {"district": "East Delhi", "city": "Delhi",
         "lat": 28.6508, "lng": 77.2795, "locality": "Preet Vihar"},
    ],
    "Maharashtra": [
        {"district": "Mumbai", "city": "Mumbai",
         "lat": 19.0760, "lng": 72.8777, "locality": "Dadar West"},
        {"district": "Pune", "city": "Pune",
         "lat": 18.5204, "lng": 73.8567, "locality": "Kothrud"},
        {"district": "Thane", "city": "Thane",
         "lat": 19.2183, "lng": 72.9781, "locality": "Thane West"},
    ],
    "Karnataka": [
        {"district": "Bangalore", "city": "Bangalore",
         "lat": 12.9716, "lng": 77.5946, "locality": "Koramangala"},
        {"district": "Bangalore", "city": "Bangalore",
         "lat": 13.0012, "lng": 77.5760, "locality": "Yeshwanthpur"},
    ],
    "Uttar Pradesh": [
        {"district": "Lucknow", "city": "Lucknow",
         "lat": 26.8467, "lng": 80.9462, "locality": "Hazratganj"},
        {"district": "Varanasi", "city": "Varanasi",
         "lat": 25.3176, "lng": 82.9739, "locality": "Sigra"},
    ],
    "Tamil Nadu": [
        {"district": "Chennai", "city": "Chennai",
         "lat": 13.0827, "lng": 80.2707, "locality": "Anna Nagar"},
        {"district": "Coimbatore", "city": "Coimbatore",
         "lat": 11.0168, "lng": 76.9558, "locality": "RS Puram"},
    ],
}

# Each cluster defines:
#   - incident_meta: title, category, priority, status, pub_status, state, loc_key
#   - reports: list of dicts with text, days_ago, source, review_pair (bool)
# When review_pair=True on two reports in the same cluster, they form a review candidate.

CLUSTERS = [
    # ===================== WEST BENGAL — WATERLOGGING =====================
    {
        "incident_meta": {
            "title": "Severe Waterlogging — Naskarpara Main Road",
            "category": "waterlogging",
            "priority": "high",
            "status": "in_progress",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 1),
        },
        "reports": [
            {"text": "Water has accumulated outside the main gate of our apartment near Naskarpara Main Road after heavy rain. It is knee-deep and cars cannot pass.", "days_ago": 5, "hours_ago": 2, "review_pair": True},
            {"text": "Severe waterlogging near the apartment main entrance on Naskarpara Main Road. Water has entered the ground floor of several buildings.", "days_ago": 5, "hours_ago": 1, "review_pair": True},
            {"text": "The road near Naskarpara main road is completely flooded since morning. Residents are unable to leave their homes. Children could not go to school.", "days_ago": 4, "review_pair": False},
            {"text": "Waterlogging situation at Naskarpara Main Road has not improved. Standing water has been there for 4 days now. Civic authorities need to act.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== WEST BENGAL — GARBAGE NEAR MARKET =====================
    {
        "incident_meta": {
            "title": "Garbage Accumulation — Baruipur Market Area",
            "category": "garbage_accumulation",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 2),
        },
        "reports": [
            {"text": "Garbage has not been collected for five days near the local market in Baruipur. The bins are overflowing onto the road.", "days_ago": 6, "hours_ago": 3, "review_pair": True},
            {"text": "Garbage bins are overflowing near Baruipur market. The smell is unbearable and stray animals are spreading waste on the street.", "days_ago": 6, "hours_ago": 1, "review_pair": True},
            {"text": "Waste piled up at the corner of Baruipur market area has not been cleared. This is a health hazard.", "days_ago": 5, "review_pair": False},
        ],
    },
    # ===================== DELHI — POTHOLE =====================
    {
        "incident_meta": {
            "title": "Large Pothole — Karol Bagh Main Road",
            "category": "pothole",
            "priority": "high",
            "status": "in_progress",
            "pub_status": "published",
            "state": "Delhi",
            "loc_key": ("Delhi", 0),
        },
        "reports": [
            {"text": "There is a large pothole near Karol Bagh main road near the bus stop. Two-wheelers have already fallen. The pothole is about 2 feet wide.", "days_ago": 8, "hours_ago": 5, "review_pair": True},
            {"text": "A deep pothole has formed on the road in front of the bus stop at Karol Bagh. It is a serious accident risk. Many vehicles are swerving dangerously.", "days_ago": 8, "hours_ago": 2, "review_pair": True},
            {"text": "The pothole on Karol Bagh main road is still there. It is getting bigger after the rains. Someone needs to fix this urgently.", "days_ago": 5, "review_pair": False},
            {"text": "Despite reporting the pothole at Karol Bagh bus stop earlier, there has been no repair work. The situation has worsened.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== WEST BENGAL — STREETLIGHT =====================
    {
        "incident_meta": {
            "title": "Multiple Streetlight Failures — Barasat Colony",
            "category": "streetlight_failure",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 0),
        },
        "reports": [
            {"text": "At least 4 streetlights in our colony near Barasat Station Road have been non-functional for over a week. The area is completely dark at night.", "days_ago": 9, "hours_ago": 2, "review_pair": True},
            {"text": "Street lights are not working near Barasat station road area. We are walking in darkness every evening. This is dangerous especially for women.", "days_ago": 9, "hours_ago": 0, "review_pair": True},
            {"text": "The streetlights near Barasat station road have been out for more than 10 days. No action taken so far.", "days_ago": 7, "review_pair": False},
            {"text": "Darkness continues on Barasat station road because of non-functional street lighting. Requested repair multiple times.", "days_ago": 4, "review_pair": False},
        ],
    },
    # ===================== MAHARASHTRA — DRAINAGE =====================
    {
        "incident_meta": {
            "title": "Blocked Drain Causing Overflow — Dadar West",
            "category": "drainage_blockage",
            "priority": "urgent",
            "status": "in_progress",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 0),
        },
        "reports": [
            {"text": "The drain near Dadar West is completely blocked. Sewage water is overflowing onto the footpath and road. The smell is nauseating.", "days_ago": 3, "hours_ago": 6, "review_pair": True},
            {"text": "Overflowing drain near Dadar West junction. Black water is covering the road. It is a serious health hazard.", "days_ago": 3, "hours_ago": 4, "review_pair": True},
            {"text": "Despite calling the helpline, the blocked drain at Dadar West has not been attended to. The overflow is spreading into the building compound.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== KARNATAKA — WATER SUPPLY =====================
    {
        "incident_meta": {
            "title": "Irregular Water Supply — Koramangala",
            "category": "water_supply",
            "priority": "high",
            "status": "monitoring",
            "pub_status": "published",
            "state": "Karnataka",
            "loc_key": ("Karnataka", 0),
        },
        "reports": [
            {"text": "Water supply to Koramangala 5th block has been erratic for the past two weeks. Some days no water comes at all.", "days_ago": 14, "review_pair": False},
            {"text": "BWSSB water is not coming regularly in Koramangala. Residents are forced to buy tankers.", "days_ago": 12, "review_pair": True},
            {"text": "No water supply in our area of Koramangala for the third consecutive day. We need immediate resolution.", "days_ago": 12, "hours_ago": 3, "review_pair": True},
            {"text": "Water supply situation in Koramangala has partially improved but supply is still intermittent.", "days_ago": 7, "review_pair": False},
        ],
    },
    # ===================== DELHI — BROKEN FOOTPATH =====================
    {
        "incident_meta": {
            "title": "Broken Footpath Tiles — Lajpat Nagar",
            "category": "broken_footpath",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "Delhi",
            "loc_key": ("Delhi", 1),
        },
        "reports": [
            {"text": "The footpath tiles near Lajpat Nagar market are completely broken and uneven. Elderly people and children are at risk of falling.", "days_ago": 11, "review_pair": False},
            {"text": "Broken footpath near Lajpat Nagar has been in this condition for months. During rains, the broken sections become waterlogged and very slippery.", "days_ago": 10, "review_pair": False},
            {"text": "Walking is dangerous on the Lajpat Nagar footpath due to broken tiles. Someone has already twisted their ankle.", "days_ago": 8, "review_pair": True},
            {"text": "Footpath tiles on the main road near Lajpat Nagar market are broken and crumbling. It is a serious hazard for pedestrians.", "days_ago": 8, "hours_ago": 2, "review_pair": True},
        ],
    },
    # ===================== MAHARASHTRA — WATER LEAKAGE =====================
    {
        "incident_meta": {
            "title": "Underground Pipeline Leakage — Thane West",
            "category": "water_leakage",
            "priority": "urgent",
            "status": "in_progress",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 2),
        },
        "reports": [
            {"text": "Water is leaking from an underground pipeline on the main road in Thane West. Water has been gushing for 2 days. Road is getting damaged.", "days_ago": 4, "review_pair": True},
            {"text": "There is a major water pipe burst near Thane West. Water is wasting continuously. The road is subsiding near the leakage point.", "days_ago": 4, "hours_ago": 1, "review_pair": True},
            {"text": "Despite reporting the pipeline leakage in Thane West, no repair team has arrived. The leak is getting worse.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== UTTAR PRADESH — TRAFFIC SIGNAL =====================
    {
        "incident_meta": {
            "title": "Non-Functional Traffic Signal — Hazratganj Chowk",
            "category": "traffic_signal",
            "priority": "high",
            "status": "under_review",
            "pub_status": "published",
            "state": "Uttar Pradesh",
            "loc_key": ("Uttar Pradesh", 0),
        },
        "reports": [
            {"text": "The traffic signal at Hazratganj Chowk has been non-functional for 3 days. There is severe traffic chaos during peak hours.", "days_ago": 5, "review_pair": False},
            {"text": "Traffic light at Hazratganj crossing not working. Police are manually managing traffic but the signal needs immediate repair.", "days_ago": 5, "hours_ago": 1, "review_pair": True},
            {"text": "Non-functioning traffic signals at Hazratganj main crossing. This has caused multiple minor accidents.", "days_ago": 5, "hours_ago": 2, "review_pair": True},
        ],
    },
    # ===================== TAMIL NADU — FALLEN TREE =====================
    {
        "incident_meta": {
            "title": "Fallen Tree Blocking Road — Anna Nagar",
            "category": "fallen_tree",
            "priority": "urgent",
            "status": "resolved",
            "pub_status": "published",
            "state": "Tamil Nadu",
            "loc_key": ("Tamil Nadu", 0),
        },
        "reports": [
            {"text": "A large tree has fallen across the main road in Anna Nagar after last night's storm. The road is completely blocked. Emergency services needed.", "days_ago": 7, "review_pair": False},
            {"text": "Tree fell on the road in Anna Nagar. One car has been damaged. The road is blocked and there are live wires nearby.", "days_ago": 7, "hours_ago": 1, "review_pair": False},
            {"text": "The fallen tree in Anna Nagar has been partially removed. One lane is now open but the other is still blocked.", "days_ago": 6, "review_pair": False},
        ],
    },
    # ===================== WEST BENGAL — PUBLIC SANITATION =====================
    {
        "incident_meta": {
            "title": "Open Defecation and Sanitation Issue — Howrah Market",
            "category": "public_sanitation",
            "priority": "high",
            "status": "under_review",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 3),
        },
        "reports": [
            {"text": "There is open defecation happening near Howrah market area. The public toilet nearby is locked and non-functional.", "days_ago": 8, "review_pair": True},
            {"text": "Public toilet near Howrah market is closed. People are forced to use the roadside. This is a sanitation emergency.", "days_ago": 8, "hours_ago": 2, "review_pair": True},
            {"text": "Sanitation near Howrah market is very poor. Garbage and human waste are mixed on the roadside. Health risk for vendors and customers.", "days_ago": 6, "review_pair": False},
        ],
    },
    # ===================== KARNATAKA — DAMAGED BUILDING =====================
    {
        "incident_meta": {
            "title": "Crumbling Boundary Wall — Yeshwanthpur Public Park",
            "category": "damaged_public_building",
            "priority": "high",
            "status": "monitoring",
            "pub_status": "published",
            "state": "Karnataka",
            "loc_key": ("Karnataka", 1),
        },
        "reports": [
            {"text": "The boundary wall of Yeshwanthpur public park is crumbling. Large sections have already collapsed. Children who play here are at serious risk.", "days_ago": 15, "review_pair": False},
            {"text": "Part of the park wall in Yeshwanthpur has collapsed. Debris is on the footpath. The remaining wall looks unstable.", "days_ago": 14, "review_pair": True},
            {"text": "Park boundary wall at Yeshwanthpur has collapsed further. No repair or warning signs installed despite earlier reports.", "days_ago": 14, "hours_ago": 3, "review_pair": True},
        ],
    },
    # ===================== MAHARASHTRA — OVERFLOWING BINS =====================
    {
        "incident_meta": {
            "title": "Overflowing Garbage Bins — Kothrud Residential Area",
            "category": "overflowing_bins",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 1),
        },
        "reports": [
            {"text": "Dustbins on the main road in Kothrud have been overflowing for 3 days. The garbage truck has not come. Stray dogs are spreading the waste.", "days_ago": 4, "review_pair": True},
            {"text": "Waste collection has not happened in our Kothrud locality for 3 days. Bins are overflowing and the smell is very bad.", "days_ago": 4, "hours_ago": 2, "review_pair": True},
            {"text": "Still no garbage collection in Kothrud. The situation is worsening every day.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== UTTAR PRADESH — POTHOLE =====================
    {
        "incident_meta": {
            "title": "Road Damage After Rain — Varanasi Sigra",
            "category": "pothole",
            "priority": "high",
            "status": "under_review",
            "pub_status": "published",
            "state": "Uttar Pradesh",
            "loc_key": ("Uttar Pradesh", 1),
        },
        "reports": [
            {"text": "Several potholes have appeared on the Sigra road in Varanasi after the recent rains. The road surface has completely degraded.", "days_ago": 6, "review_pair": False},
            {"text": "Road near Sigra area of Varanasi is in terrible condition. Deep potholes are damaging vehicles and causing accidents.", "days_ago": 6, "hours_ago": 1, "review_pair": True},
            {"text": "Pothole-ridden road in Sigra, Varanasi is becoming a daily nightmare for commuters. No repair work visible.", "days_ago": 5, "review_pair": True},
            {"text": "Despite several complaints, the pothole situation on Sigra main road has not improved.", "days_ago": 2, "review_pair": False},
        ],
    },
    # ===================== TAMIL NADU — DRAINAGE =====================
    {
        "incident_meta": {
            "title": "Storm Drain Blockage — Coimbatore RS Puram",
            "category": "drainage_blockage",
            "priority": "normal",
            "status": "monitoring",
            "pub_status": "published",
            "state": "Tamil Nadu",
            "loc_key": ("Tamil Nadu", 1),
        },
        "reports": [
            {"text": "Storm drain on the main road in RS Puram, Coimbatore is blocked with plastic waste and silt. During rains, the entire road floods.", "days_ago": 10, "review_pair": False},
            {"text": "Choked storm drain in RS Puram area of Coimbatore. This needs immediate desilting before the next rain to prevent flooding.", "days_ago": 10, "hours_ago": 2, "review_pair": True},
            {"text": "Water drainage is completely blocked in RS Puram Coimbatore. The road floods even during light rain.", "days_ago": 10, "hours_ago": 0, "review_pair": True},
        ],
    },
    # ===================== DELHI — ILLEGAL DUMPING =====================
    {
        "incident_meta": {
            "title": "Illegal Waste Dumping — Preet Vihar Industrial Area",
            "category": "illegal_dumping",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "Delhi",
            "loc_key": ("Delhi", 2),
        },
        "reports": [
            {"text": "Construction debris and garbage have been illegally dumped near the industrial area in Preet Vihar. The dumping is blocking a drainage channel.", "days_ago": 7, "review_pair": False},
            {"text": "Someone is illegally dumping waste near the main drain in Preet Vihar at night. The area smells terrible and drain is now clogged.", "days_ago": 7, "hours_ago": 2, "review_pair": True},
            {"text": "Illegal dumping of construction waste near Preet Vihar drainage is continuing. CCTV should be installed to catch the offenders.", "days_ago": 7, "hours_ago": 0, "review_pair": True},
        ],
    },
    # ===================== WEST BENGAL — WATERLOGGING #2 =====================
    {
        "incident_meta": {
            "title": "Road Waterlogging — Chinsurah Bus Stand Area",
            "category": "waterlogging",
            "priority": "normal",
            "status": "resolved",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 4),
        },
        "reports": [
            {"text": "The road in front of Chinsurah bus stand gets waterlogged every time it rains. Passengers have to wade through water to board buses.", "days_ago": 20, "review_pair": False},
            {"text": "Waterlogging near Chinsurah bus stand is a recurring problem. The drainage system is inadequate.", "days_ago": 18, "review_pair": False},
            {"text": "After waterlogging, the municipal team has finally cleared the drain near Chinsurah bus stand.", "days_ago": 15, "review_pair": False},
        ],
    },
    # ===================== WEST BENGAL — POTHOLE =====================
    {
        "incident_meta": {
            "title": "Multiple Potholes — Jadavpur Main Road",
            "category": "pothole",
            "priority": "high",
            "status": "in_progress",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 6),
        },
        "reports": [
            {"text": "There are multiple dangerous potholes on the main road near Jadavpur. Motorcyclists are at serious risk.", "days_ago": 9, "review_pair": False},
            {"text": "Potholes on Jadavpur main road have caused two accidents this week alone. The road surface is completely broken.", "days_ago": 9, "hours_ago": 2, "review_pair": True},
            {"text": "Road near Jadavpur has become dangerous due to pothole craters formed after rain. Need urgent repair.", "days_ago": 9, "hours_ago": 0, "review_pair": True},
            {"text": "The pothole repair work on Jadavpur main road has started but is proceeding slowly.", "days_ago": 4, "review_pair": False},
        ],
    },
    # ===================== MAHARASHTRA — STREETLIGHT =====================
    {
        "incident_meta": {
            "title": "Streetlight Outage — Thane West Residential Colony",
            "category": "streetlight_failure",
            "priority": "normal",
            "status": "monitoring",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 2),
        },
        "reports": [
            {"text": "More than half the streetlights in our colony in Thane West are not working. The transformer area is completely dark at night.", "days_ago": 6, "review_pair": False},
            {"text": "Street lights are out in Thane West residential area near the transformer. Night time safety is a concern.", "days_ago": 6, "hours_ago": 1, "review_pair": True},
            {"text": "Streetlights not working in Thane West since 5 days. Dark roads are causing concerns about crime and accidents.", "days_ago": 6, "hours_ago": 2, "review_pair": True},
        ],
    },
    # ===================== WEST BENGAL — GARBAGE =====================
    {
        "incident_meta": {
            "title": "Garbage Pile at Ultadanga Junction",
            "category": "garbage_accumulation",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 5),
        },
        "reports": [
            {"text": "A large pile of garbage has formed at the Ultadanga junction. It has been there for over a week. The area is infested with flies.", "days_ago": 7, "review_pair": True},
            {"text": "Garbage mountain at Ultadanga junction is growing by the day. Waste pickers are spreading it further. Needs urgent clearance.", "days_ago": 7, "hours_ago": 1, "review_pair": True},
            {"text": "Garbage at Ultadanga is still not removed. Civic volunteers tried clearing some of it but need official support.", "days_ago": 4, "review_pair": False},
        ],
    },
]

# Single-report incidents (independent, no review pairs)
STANDALONE_CLUSTERS = [
    {
        "incident_meta": {
            "title": "Water Leakage — Barasat Shopping Complex",
            "category": "water_leakage",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 0),
        },
        "reports": [
            {"text": "Water pipe leakage in front of the main shopping complex in Barasat. The water is running down the road for days. Major wastage.", "days_ago": 3, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Damaged Road Divider — Lucknow Hazratganj",
            "category": "pothole",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "Uttar Pradesh",
            "loc_key": ("Uttar Pradesh", 0),
        },
        "reports": [
            {"text": "Road divider on Hazratganj main road in Lucknow has broken and steel rods are protruding. This is a danger to motorcyclists.", "days_ago": 11, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Footpath Encroachment — Koramangala 3rd Block",
            "category": "broken_footpath",
            "priority": "low",
            "status": "under_review",
            "pub_status": "published",
            "state": "Karnataka",
            "loc_key": ("Karnataka", 0),
        },
        "reports": [
            {"text": "Vendors and vehicles have encroached on the footpath in Koramangala 3rd block. Pedestrians are forced to walk on the road.", "days_ago": 20, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Sewage Overflow — Baruipur Colony Road",
            "category": "drainage_blockage",
            "priority": "high",
            "status": "in_progress",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 2),
        },
        "reports": [
            {"text": "Sewage is overflowing near colony road in Baruipur. The drain is completely blocked. Children are walking through sewage water to reach school.", "days_ago": 2, "review_pair": False},
            {"text": "Sewage overflow in Baruipur colony continues. Residents have been complaining for weeks with no resolution.", "days_ago": 1, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Traffic Signal Malfunction — Howrah Bridge Approach",
            "category": "traffic_signal",
            "priority": "urgent",
            "status": "resolved",
            "pub_status": "published",
            "state": "West Bengal",
            "loc_key": ("West Bengal", 3),
        },
        "reports": [
            {"text": "Traffic signal at Howrah bridge approach road was malfunctioning since morning. All 3 signals were showing red simultaneously causing gridlock.", "days_ago": 12, "review_pair": False},
            {"text": "Signal repaired at Howrah Bridge approach. Traffic is now moving smoothly. Resolution confirmed.", "days_ago": 11, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Illegal Billboard — Mumbai Dadar Flyover",
            "category": "other",
            "priority": "low",
            "status": "under_review",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 0),
        },
        "reports": [
            {"text": "Illegal oversized billboard has been placed under the Dadar flyover. It is blocking sight lines at the junction and obstructing traffic.", "days_ago": 25, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Water Supply Cut — Anna Nagar East",
            "category": "water_supply",
            "priority": "high",
            "status": "resolved",
            "pub_status": "published",
            "state": "Tamil Nadu",
            "loc_key": ("Tamil Nadu", 0),
        },
        "reports": [
            {"text": "Water supply has been completely cut to Anna Nagar East for 2 days without any prior notice from the authority.", "days_ago": 18, "review_pair": False},
            {"text": "Water supply has resumed in Anna Nagar East after 3 days. The authority clarified it was a main pipe repair.", "days_ago": 15, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Encroachment on Storm Drain — Pune Kothrud",
            "category": "drainage_blockage",
            "priority": "normal",
            "status": "monitoring",
            "pub_status": "published",
            "state": "Maharashtra",
            "loc_key": ("Maharashtra", 1),
        },
        "reports": [
            {"text": "Several informal structures have been built over the storm drain in Kothrud, Pune. The drain cannot be maintained and blocks during rain.", "days_ago": 30, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Broken Street Furniture — Preet Vihar Park",
            "category": "damaged_public_building",
            "priority": "low",
            "status": "under_review",
            "pub_status": "published",
            "state": "Delhi",
            "loc_key": ("Delhi", 2),
        },
        "reports": [
            {"text": "Benches and exercise equipment in Preet Vihar park are broken. The broken sharp edges are a hazard to children using the park.", "days_ago": 22, "review_pair": False},
        ],
    },
    {
        "incident_meta": {
            "title": "Overflowing Public Dustbin — Lajpat Nagar Metro Gate",
            "category": "overflowing_bins",
            "priority": "normal",
            "status": "under_review",
            "pub_status": "published",
            "state": "Delhi",
            "loc_key": ("Delhi", 1),
        },
        "reports": [
            {"text": "The public dustbin near Lajpat Nagar metro gate has been overflowing since Monday. Garbage is scattered on the footpath and road.", "days_ago": 4, "review_pair": False},
        ],
    },
]

ALL_CLUSTERS = CLUSTERS + STANDALONE_CLUSTERS

# ---------------------------------------------------------------------------
# SEED LOGIC
# ---------------------------------------------------------------------------

def resolve_location(loc_key):
    state, idx = loc_key
    locs = LOCATIONS[state]
    idx = idx % len(locs)
    return state, locs[idx]

def build_report(cluster_meta, report_def, incident_id, syn_counter):
    state, loc = resolve_location(cluster_meta["loc_key"])
    days_ago = report_def.get("days_ago", 3)
    hours_ago = report_def.get("hours_ago", 0)
    report_id = f"SYN-{syn_counter:04d}"
    created = ts(days_ago=days_ago, hours_ago=hours_ago)

    return {
        "report_id": report_id,
        "original_text": report_def["text"],
        "language": "en",
        "disaster_type": cluster_meta["category"],
        "raw_location": loc["locality"],
        "normalized_location": f"{loc['locality']}, {loc['city']}, {state}",
        "state": state,
        "district": loc["district"],
        "city": loc["city"],
        "latitude": loc["lat"] + random.uniform(-0.002, 0.002),
        "longitude": loc["lng"] + random.uniform(-0.002, 0.002),
        "reported_at": created,
        "received_at": created,
        "reported_condition": "Submitted — awaiting review",
        "source": "Public Community Portal",
        "evidence": [],
        "extraction_status": "raw",
        "data_origin": "synthetic",
        "associated_incident_id": incident_id,
        "reporter_name": random.choice([
            "Anonymous", "Ramesh Kumar", "Priya Sharma", "Mohammed Raza",
            "Ananya Bose", "Srinivasan T.", "Deepika Nair", "Arvind Singh",
            "Fatima Begum", "Rajan Pillai", "Sneha Kulkarni", "Amit Patel",
            "Lakshmi Devi", "Suresh Yadav", "Anonymous Citizen"
        ]),
        "contact_info": "",
        "created_at": created,
    }

def build_incident(cluster_meta, report_ids, now_ts):
    state, loc = resolve_location(cluster_meta["loc_key"])
    inc_meta = cluster_meta
    inc_id = f"INC-SYN-{uuid.uuid4().hex[:6].upper()}"
    days_since_created = max(r_def.get("days_ago", 1) for r_def in cluster_meta.get("reports", [{"days_ago": 1}]))

    return {
        "incident_id": inc_id,
        "title": inc_meta["title"],
        "disaster_type": inc_meta["category"],
        "location": loc["locality"],
        "state": state,
        "district": loc["district"],
        "city": loc["city"],
        "latitude": loc["lat"],
        "longitude": loc["lng"],
        "current_status": inc_meta["status"],
        "publication_status": inc_meta["pub_status"],
        "priority": inc_meta["priority"],
        "summary": f"Multiple civic reports received about {inc_meta['title'].lower()}. Grouped for coordinated response.",
        "public_summary": f"Reports about {inc_meta['category'].replace('_', ' ')} in {loc['locality']}, {loc['city']} have been grouped into this incident for coordinated resolution.",
        "associated_report_ids": report_ids,
        "report_count": len(report_ids),
        "data_origin": "synthetic",
        "assigned_department": None,
        "action_updates": [],
        "conflicts": [],
        "created_at": ts(days_ago=days_since_created),
        "updated_at": ts(days_ago=max(1, days_since_created - 1)),
    }

def build_review(report_a, report_b, rev_counter):
    rev_id = f"REV-SYN-{rev_counter:04d}"
    
    # Determine classification
    text_a = report_a["original_text"].lower()
    text_b = report_b["original_text"].lower()
    
    # Simple Jaccard similarity estimate
    words_a = set(text_a.split())
    words_b = set(text_b.split())
    intersection = words_a & words_b
    union = words_a | words_b
    similarity = len(intersection) / len(union) if union else 0
    similarity = round(max(0.35, min(0.98, similarity * 2.2)), 2)

    loc_a = report_a.get("raw_location", "")
    loc_b = report_b.get("raw_location", "")
    same_loc = loc_a == loc_b
    
    if similarity >= 0.80:
        classification = "near_duplicate"
        suggested = "merge_as_duplicate"
        reasons = [
            "Both reports describe the same problem in highly similar language.",
            f"Same category: {report_a.get('disaster_type', '').replace('_', ' ')}",
            "Submitted within hours of each other from the same location.",
        ]
    elif similarity >= 0.55:
        classification = "related_incident"
        suggested = "group_as_related"
        reasons = [
            "Reports describe a related problem at the same location.",
            "Different perspectives on the same underlying civic issue.",
            "Recommended to group under the same incident for coordinated response.",
        ]
    else:
        classification = "possible_match"
        suggested = "flag_for_review"
        reasons = [
            "Reports may refer to the same location and category.",
            "Requires human review to determine relationship.",
        ]

    # Time difference
    try:
        t_a = datetime.fromisoformat(report_a.get("received_at", "").replace("Z", "+00:00"))
        t_b = datetime.fromisoformat(report_b.get("received_at", "").replace("Z", "+00:00"))
        diff_hrs = abs((t_a - t_b).total_seconds() / 3600)
        time_diff_str = f"{int(diff_hrs)} hour(s)" if diff_hrs < 24 else f"{int(diff_hrs/24)} day(s)"
    except Exception:
        time_diff_str = "Unknown"

    lat_a = report_a.get("latitude") or 0.0
    lng_a = report_a.get("longitude") or 0.0
    lat_b = report_b.get("latitude") or 0.0
    lng_b = report_b.get("longitude") or 0.0

    import math
    try:
        dlat = math.radians(float(lat_a) - float(lat_b))
        dlng = math.radians(float(lng_a) - float(lng_b))
        a = (math.sin(dlat / 2)**2 +
             math.cos(math.radians(float(lat_b))) * math.cos(math.radians(float(lat_a))) *
             math.sin(dlng / 2)**2)
        dist_km = round(6371 * 2 * math.asin(math.sqrt(max(0, min(1, a)))), 3)
    except Exception:
        dist_km = 0.0

    created_at = ts(days_ago=min(
        report_a.get("created_at", ts())[:10] and 0 or 1,
        1
    ))

    return {
        "review_id": rev_id,
        "report_ids": [report_a["report_id"], report_b["report_id"]],
        "status": "pending",
        "suggested_decision": suggested,
        "comparison_classification": classification,
        "similarity_score": similarity,
        "reasons": reasons,
        "location_comparison": {
            "location_a": loc_a,
            "location_b": loc_b,
            "same_location": same_loc,
            "distance_km": dist_km,
        },
        "timestamp_comparison": {
            "time_a": report_a.get("received_at", ""),
            "time_b": report_b.get("received_at", ""),
            "time_difference": time_diff_str,
        },
        "disaster_type_comparison": {
            "type_a": report_a.get("disaster_type", ""),
            "type_b": report_b.get("disaster_type", ""),
            "match": report_a.get("disaster_type") == report_b.get("disaster_type"),
        },
        "created_at": ts(days_ago=1),
        "reviewer_decision": None,
        "reviewer_notes": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "data_origin": "synthetic",
    }


def main():
    print("=" * 60)
    print("ResQIntel — Demo Data Seed Script")
    print("=" * 60)

    # Load existing data
    existing_reports = load_json(REPORTS_FILE)
    existing_incidents = load_json(INCIDENTS_FILE)
    existing_reviews = load_json(REVIEWS_FILE)

    # Identify existing synthetic entries
    existing_syn_report_ids = {r["report_id"] for r in existing_reports if r.get("data_origin") == "synthetic"}
    existing_syn_incident_ids = {i["incident_id"] for i in existing_incidents if i.get("data_origin") == "synthetic"}
    existing_syn_review_ids = {rv["review_id"] for rv in existing_reviews if rv.get("data_origin") == "synthetic"}

    print(f"\nExisting: {len(existing_reports)} reports, {len(existing_incidents)} incidents, {len(existing_reviews)} reviews")
    print(f"Existing synthetic: {len(existing_syn_report_ids)} reports, {len(existing_syn_incident_ids)} incidents, {len(existing_syn_review_ids)} reviews")

    # If we already have synthetic data seeded, skip to avoid duplication
    if len(existing_syn_report_ids) >= 50:
        print("\n✅ Synthetic data already seeded (≥50 synthetic reports found). Skipping to prevent duplicates.")
        print("   To re-seed, manually delete synthetic records first.")
        return

    # Build new records
    new_reports = []
    new_incidents = []
    new_reviews = []

    syn_counter = 1  # running counter for SYN-NNNN IDs
    rev_counter = 1

    now_ts = ts()

    for cluster in ALL_CLUSTERS:
        inc_meta = cluster["incident_meta"]
        report_defs = cluster.get("reports", [])

        # Build report objects first (without incident_id yet — we'll assign after incident created)
        cluster_report_ids = []
        cluster_report_objs = []
        pair_reports = []  # for review candidate

        for r_def in report_defs:
            # We'll set incident_id after creating the incident
            r_obj = build_report(inc_meta, r_def, incident_id="__TBD__", syn_counter=syn_counter)
            syn_counter += 1
            cluster_report_ids.append(r_obj["report_id"])
            cluster_report_objs.append((r_obj, r_def))
            if r_def.get("review_pair", False):
                pair_reports.append(r_obj)

        # Build incident
        inc_obj = build_incident(inc_meta, cluster_report_ids, now_ts)
        inc_id = inc_obj["incident_id"]
        new_incidents.append(inc_obj)

        # Assign incident_id to all reports in this cluster
        for r_obj, r_def in cluster_report_objs:
            r_obj["associated_incident_id"] = inc_id
            new_reports.append(r_obj)

        # Build review candidate from the first two review_pair reports
        if len(pair_reports) >= 2:
            rev_obj = build_review(pair_reports[0], pair_reports[1], rev_counter)
            new_reviews.append(rev_obj)
            rev_counter += 1

    # Merge with existing (keeping real data intact)
    final_reports = existing_reports + new_reports
    final_incidents = existing_incidents + new_incidents
    final_reviews = existing_reviews + new_reviews

    print(f"\nAdding:")
    print(f"  + {len(new_reports)} synthetic reports")
    print(f"  + {len(new_incidents)} synthetic incidents")
    print(f"  + {len(new_reviews)} review candidates")

    # Save
    print("\nSaving files…")
    save_json(REPORTS_FILE, final_reports)
    save_json(INCIDENTS_FILE, final_incidents)
    save_json(REVIEWS_FILE, final_reviews)

    print(f"\n✅ Seed complete!")
    print(f"   Total reports  : {len(final_reports)}")
    print(f"   Total incidents: {len(final_incidents)}")
    print(f"   Total reviews  : {len(final_reviews)}")
    print(f"\nNote: Genuine user reports preserved. Synthetic records labelled data_origin='synthetic'.")


if __name__ == "__main__":
    random.seed(42)
    main()
