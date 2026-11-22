"""
End-to-End Verification of ResQIntel Civic Issue Reporting & Incident Management Platform.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timezone
from app.services.emergency_service import EmergencyService
from app.schemas.schemas import PublicReportSubmission, IncidentUpdate
from app.services.reconciliation_engine import (
    haversine_distance_km,
    compute_text_similarity,
    reconciliation_engine
)

def run_tests():
    print("=" * 65)
    print("RESQINTEL END-TO-END CIVIC PLATFORM VERIFICATION")
    print("=" * 65)

    service = EmergencyService()

    # 1. Admin Auth Check
    admin = service.authenticate_user("admin@resqintel.org", "Admin@ResQ2026!")
    assert admin is not None, "Admin authentication failed"
    print(f"[PASS] 1. Admin Authentication: Logged in as {admin['email']} (role: {admin['role']})")

    # 2. Public Report Submission (Civic issue: Pothole)
    sub = PublicReportSubmission(
        disaster_type="pothole",
        raw_location="Park Street junction near metro station",
        report_description="Deep pothole causing heavy traffic slowdown and risk to two-wheelers.",
        state="West Bengal",
        district="Kolkata",
        city="Kolkata",
        latitude=22.5530,
        longitude=88.3520,
        reporter_name="Debabrata Roy",
        contact_info="debabrata@example.com"
    )

    res = service.submit_public_report(sub)
    assert res.reference_id.startswith("RPT-2026-"), f"Unexpected ID format: {res.reference_id}"
    print(f"[PASS] 2. Public Report Intake: Generated ID '{res.reference_id}' with status '{res.status}'")

    # 3. Auto Incident Association Check
    report = service.get_report_by_id(res.reference_id)
    assert report is not None, "Report was not persisted"
    assert report["associated_incident_id"] is not None, "Report was not associated with an incident"
    linked_inc_id = report["associated_incident_id"]
    print(f"[PASS] 3. Automatic Incident Linking: Report linked to incident '{linked_inc_id}'")

    # 4. Incident Integrity & Count Accuracy Check
    inc_detail = service.get_incident_by_id(linked_inc_id, public_view=False)
    assert inc_detail is not None, "Linked incident not found"
    actual_reports = inc_detail.get("associated_reports", [])
    stated_count = inc_detail.get("report_count", 0)
    assert len(actual_reports) == stated_count, f"Count mismatch! associated_reports has {len(actual_reports)}, but report_count is {stated_count}"
    print(f"[PASS] 4. Incident Integrity: Report count ({stated_count}) matches actual linked reports ({len(actual_reports)})")

    # 5. Tracking Submission Check
    tracked = service.track_submission(res.reference_id, res.tracking_token)
    assert tracked is not None, "Tracking failed with reference ID and token"
    assert tracked.reference_id == res.reference_id
    assert tracked.status == "under_review"
    print(f"[PASS] 5. Citizen Tracking: Verified report status '{tracked.status}' via reference ID")

    # 6. Admin Department Assignment & Workflow Update
    update_req = IncidentUpdate(
        current_status="in_progress",
        priority="high",
        assigned_department="Roads & Highway Maintenance"
    )
    updated_inc = service.update_incident(linked_inc_id, update_req, admin)
    assert updated_inc["current_status"] == "in_progress"
    assert updated_inc["priority"] == "high"
    assert updated_inc["assigned_department"] == "Roads & Highway Maintenance"
    print(f"[PASS] 6. Admin Incident Workflow: Set status='in_progress', priority='high', dept='{updated_inc['assigned_department']}'")

    # 7. Public Safety / Information Privacy Check
    # Ensure the incident starts unpublished for this test
    service.update_incident(linked_inc_id, IncidentUpdate(publication_status="unpublished"), admin)
    public_view = service.get_incident_by_id(linked_inc_id, public_view=True)
    assert public_view is None, "Unpublished incident should NOT be visible to the public"
    
    # Now publish it and check public view
    service.update_incident(linked_inc_id, IncidentUpdate(publication_status="published"), admin)
    public_view_pub = service.get_incident_by_id(linked_inc_id, public_view=True)
    assert public_view_pub is not None, "Published incident should be visible"
    assert "conflicts" not in public_view_pub, "Internal conflicts must be redacted from public view"
    assert "associated_report_ids" not in public_view_pub, "Internal report IDs must be redacted"
    print(f"[PASS] 7. Public Privacy Boundaries: Sensitive operational metadata properly redacted in public view")

    # 8. Reconciliation Engine Check
    # Park Street (22.5530, 88.3520) vs Esplanade (22.5645, 88.3518) ~ 1.28 km
    dist = haversine_distance_km(22.5530, 88.3520, 22.5645, 88.3518)
    assert 1.0 < dist < 1.6, f"Distance should be ~1.28 km, got {dist}"
    
    sim = compute_text_similarity(
        "Deep pothole on main road causing traffic delays",
        "Deep pothole on main road causing traffic delays and vehicle damage"
    )
    assert sim > 0.4, f"Text similarity should be > 0.4, got {sim}"
    print(f"[PASS] 8. Reconciliation Engine: Haversine distance={dist:.2f}km, Text similarity={sim:.2f}")

    # 9. Dashboard Stats Check
    stats = service.get_dashboard_stats()
    assert stats.total_submitted_reports >= 70, f"Expected at least 70 reports, got {stats.total_submitted_reports}"
    assert stats.distinct_incidents >= 25, f"Expected at least 25 incidents, got {stats.distinct_incidents}"
    print(f"[PASS] 9. Dashboard Analytics: {stats.total_submitted_reports} reports, {stats.distinct_incidents} incidents ({stats.active_incidents} active, {stats.resolved_incidents} resolved)")

    print("\n" + "=" * 65)
    print("ALL 9 CORE WORKFLOW SUITES PASSED WITH ZERO ERRORS.")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
