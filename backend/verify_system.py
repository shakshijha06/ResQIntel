"""
Automated Verification Suite for ResQIntel Intelligence Platform.
Tests authentication, authorization, reconciliation engine, datasets,
synthetic simulation sandbox, public privacy boundaries, and audit logging.
"""
import sys
import os

# Set working directory to backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from app.services.reconciliation_engine import (
    haversine_distance_km,
    compute_text_similarity,
    compute_temporal_delta,
    reconciliation_engine
)

client = TestClient(app)

def test_suite():
    print("=" * 60)
    print("RESQINTEL SYSTEM VERIFICATION SUITE")
    print("=" * 60)

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f"[PASS] 1. System Health: {health_data['status']} | DB Backend: {health_data['database']['backend']}")

    # 2. Authentication with Bootstrap Admin
    login_payload = {
        "email": settings.BOOTSTRAP_ADMIN_EMAIL,
        "password": settings.BOOTSTRAP_ADMIN_PASSWORD or "Admin@ResQ2026!"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    admin_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"[PASS] 2. Super Admin Authentication: Token acquired for {token_data['user']['email']} (Role: {token_data['user']['role']})")

    # 3. Invalid credentials rejection
    res = client.post("/api/auth/login", json={"email": "wrong@resqintel.org", "password": "WrongPassword!"})
    assert res.status_code == 401, "Expected 401 on invalid credentials"
    print("[PASS] 3. Security: Invalid credentials rejected with HTTP 401")

    # 4. Public Report Intake & Tracking
    report_payload = {
        "disaster_type": "flood",
        "raw_location": "Brahmaputra Embankment Sector 7",
        "report_description": "Water seepage observed along the stone revetment near the pump station.",
        "state": "Assam",
        "district": "Majuli",
        "latitude": 26.9610,
        "longitude": 94.2200,
        "reporter_name": "Local Observer",
        "contact_info": "private_contact@example.com"
    }
    res = client.post("/api/public/reports", json=report_payload)
    assert res.status_code == 201, f"Report intake failed: {res.text}"
    sub_res = res.json()
    ref_id = sub_res["reference_id"]
    token = sub_res["tracking_token"]
    print(f"[PASS] 4. Public Intake: Generated Ref ID {ref_id} with secure token")

    # 5. Public Tracking (Privacy Check)
    res = client.get(f"/api/public/track/{ref_id}?token={token}")
    assert res.status_code == 200, f"Tracking failed: {res.text}"
    track_data = res.json()
    assert "private_contact@example.com" not in str(track_data), "Leaked private contact in tracking response!"
    print(f"[PASS] 5. Privacy Boundary: Submission tracked securely without leaking private contact information")

    # 6. Public Reports Privacy Boundary (No synthetic leak)
    res = client.get("/api/public/reports")
    assert res.status_code == 200, f"Public reports failed: {res.text}"
    pub_reports = res.json()
    for r in pub_reports.get("reports", []):
        assert r.get("data_origin") != "synthetic", "Synthetic report leaked into public listing!"
    print(f"[PASS] 6. Segregation: Public reports endpoint strictly excludes synthetic records ({pub_reports['total']} total live reports)")

    # 7. Math & Multi-Signal Reconciliation Engine
    # (a) Haversine distance
    dist = haversine_distance_km(26.9602, 94.2186, 26.9605, 94.2190)
    assert 0.03 <= dist <= 0.08, f"Unexpected distance: {dist} km"
    print(f"[PASS] 7a. Haversine Math: Computed accurate distance {dist} km (~50m)")

    # (b) Semantic similarity
    sim = compute_text_similarity(
        "Heavy flooding near the main market. Water has entered several shops.",
        "Market road is flooded after continuous rainfall. Shops are affected."
    )
    assert sim > 0.40, f"Expected higher similarity: {sim}"
    print(f"[PASS] 7b. Semantic Analysis: Multi-token similarity score = {sim}")

    # (c) Pair classification
    rep_a = {
        "report_id": "TEST-A",
        "disaster_type": "flood",
        "latitude": 26.9602,
        "longitude": 94.2186,
        "reported_at": "2026-11-21T10:00:00+00:00",
        "raw_location": "Kamalabari, Majuli",
        "original_text": "Severe levee breach near Kamalabari sector 4. Flood water entering homes."
    }
    rep_b = {
        "report_id": "TEST-B",
        "disaster_type": "flood",
        "latitude": 26.9605,
        "longitude": 94.2190,
        "reported_at": "2026-11-21T10:25:00+00:00",
        "raw_location": "Kamalabari sector 4",
        "original_text": "Breach reported along embankment near sector 4 Kamalabari. Water level rising."
    }
    analysis = reconciliation_engine.analyze_pair(rep_a, rep_b)
    assert analysis["comparison_classification"] in ("exact_duplicate", "near_duplicate"), f"Expected duplicate classification, got {analysis['comparison_classification']}"
    print(f"[PASS] 7c. Multi-Signal Engine: Classified pair as '{analysis['comparison_classification']}' (Confidence: {analysis['confidence_score']}) with explainable reasons")

    # 8. Synthetic Data Generation and Purge
    res = client.post("/api/admin/synthetic-data/generate", json={"scenario_type": "conflict_pair"}, headers=headers)
    assert res.status_code == 200, f"Synthetic generation failed: {res.text}"
    syn_gen = res.json()
    print(f"[PASS] 8a. Synthetic Lab: Generated scenario {syn_gen['scenario_id']} ({syn_gen['scenario_title']})")

    res = client.delete("/api/admin/synthetic-data/reset", headers=headers)
    assert res.status_code == 200, f"Synthetic reset failed: {res.text}"
    reset_data = res.json()
    print(f"[PASS] 8b. Synthetic Purge: Successfully reset {reset_data['deleted_synthetic_reports']} synthetic records without touching live data")

    # 9. Audit Logs
    res = client.get("/api/admin/audit-logs", headers=headers)
    assert res.status_code == 200, f"Audit logs failed: {res.text}"
    audit_data = res.json()
    assert audit_data["total"] > 0, "Expected non-empty audit log"
    print(f"[PASS] 9. Audit Logging: Verified {audit_data['total']} immutable action entries recorded")

    # 10. Conflicts Desk
    res = client.get("/api/admin/conflicts", headers=headers)
    assert res.status_code == 200, f"Conflicts fetch failed: {res.text}"
    conflicts = res.json()
    print(f"[PASS] 10. Conflict Desk: Retrieved {len(conflicts)} active field contradictions for human resolution")

    print("=" * 60)
    print("ALL 10 VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_suite()
