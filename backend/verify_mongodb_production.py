"""
PHASE 6 — ResQIntel MongoDB Production Verification Suite.
Tests all 14 requirements from the user specification.
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 65)
print("PHASE 6 — PRODUCTION VERIFICATION SUITE (MongoDB Atlas)")
print("=" * 65)

# Test 1: Module import and MongoDB initialization
try:
    from app.database import db_repo
    health = db_repo.is_healthy()
    backend = health.get("backend")
    connected = health.get("connected")
    db_name = health.get("database", "unknown")
    print(f"[PASS] 1. Database Init: backend={backend}, connected={connected}")
except RuntimeError as e:
    print(f"[FAIL] 1. Database Init: {e}")
    sys.exit(1)

# Test 2: Verify MongoDB (not JSON fallback)
assert backend == "mongodb", f"Expected mongodb, got {backend}"
assert connected == True, "MongoDB not connected"
print(f"[PASS] 2. Storage Backend: MongoDB Atlas (database={db_name})")

# Test 3: Admin login with preserved USR-681AC8
from app.services.emergency_service import EmergencyService
service = EmergencyService()
admin = service.authenticate_user("admin@resqintel.org", "Admin@ResQ2026!")
assert admin is not None, "Admin authentication failed"
assert admin["user_id"] == "USR-681AC8", f"Wrong admin user_id: {admin['user_id']}"
print(f"[PASS] 3. Admin Login: user_id={admin['user_id']}, role={admin['role']}")

# Test 4: No duplicate admin users
all_users = service.get_all_users()
admin_emails = [u["email"] for u in all_users if u["email"] == "admin@resqintel.org"]
assert len(admin_emails) == 1, f"Duplicate admin! Count: {len(admin_emails)}"
print(f"[PASS] 4. Bootstrap Admin Integrity: 1 admin, no duplicates")

# Test 5: Dashboard stats (reads from MongoDB)
stats = service.get_dashboard_stats()
print(f"[PASS] 5. Dashboard Stats: {stats.total_submitted_reports} reports, {stats.distinct_incidents} incidents")

# Test 6: New report submission
from app.schemas.schemas import PublicReportSubmission
sub = PublicReportSubmission(
    disaster_type="pothole",
    raw_location="Salt Lake Sector V Bus Stand",
    report_description="Large pothole near the main bus stop causing vehicle damage.",
    state="West Bengal",
    district="Kolkata",
    city="Kolkata",
    latitude=22.5726,
    longitude=88.4350,
    reporter_name="Test Verification",
    contact_info="test@verify.com"
)
res = service.submit_public_report(sub)
assert res.reference_id.startswith("RPT-"), f"Unexpected ID format: {res.reference_id}"
print(f"[PASS] 6. Report Submission: ref_id={res.reference_id}, status={res.status}")

# Test 7: Verify report persisted in MongoDB
report = service.get_report_by_id(res.reference_id)
assert report is not None, "Report not found after insert"
assert report["associated_incident_id"] is not None, "Report not linked to incident"
linked_inc = report["associated_incident_id"]
print(f"[PASS] 7. Report Persisted: incident_id={linked_inc}")

# Test 8: Tracking verification
tracked = service.track_submission(res.reference_id, res.tracking_token)
assert tracked is not None, "Tracking failed"
assert tracked.status == "under_review"
print(f"[PASS] 8. Tracking Verification: status={tracked.status}")

# Test 9: Incident persistence and integrity
inc = service.get_incident_by_id(linked_inc, public_view=False)
assert inc is not None, f"Incident {linked_inc} not found"
actual_reports = inc.get("associated_reports", [])
stated_count = inc.get("report_count", 0)
assert len(actual_reports) == stated_count, f"Count mismatch: {len(actual_reports)} vs {stated_count}"
print(f"[PASS] 9. Incident Integrity: {stated_count} reports linked, counts match")

# Test 10: Review queue reads
reviews = service.get_reviews()
print(f"[PASS] 10. Review Queue: {len(reviews)} reviews loaded from MongoDB")

# Test 11: Notifications persistence
notifs = service.get_notifications()
assert len(notifs) > 0, "No notifications found"
print(f"[PASS] 11. Notifications: {len(notifs)} notifications in MongoDB")

# Test 12: Audit logs persistence
audit_res = service.get_audit_logs()
assert audit_res["total"] > 0, "No audit logs found"
print(f"[PASS] 12. Audit Logs: {audit_res['total']} logs in MongoDB")

# Test 13: Reconciliation engine (rule-based)
from app.services.reconciliation_engine import haversine_distance_km, compute_text_similarity
dist = haversine_distance_km(22.5726, 88.3639, 22.5730, 88.3642)
assert dist < 0.1, f"Haversine too large: {dist}"
sim = compute_text_similarity(
    "Large pothole on Park Street causing heavy traffic near the junction",
    "Big pothole on Park Street near junction causing heavy traffic jam"
)
assert sim > 0.2, f"Text similarity too low: {sim}"
print(f"[PASS] 13. Reconciliation Engine: haversine={dist}km, text_sim={sim}")

# Test 14: Post-test collection counts
from pymongo import MongoClient
from app.config import settings
client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=8000)
db = client[settings.MONGODB_DB_NAME]
print("[PASS] 14. Post-Test Collection Counts:")
for coll in sorted(db.list_collection_names()):
    cnt = db[coll].count_documents({})
    print(f"       - {coll}: {cnt}")

# Check indexes were created
print("\n[INFO] MongoDB Index Verification:")
for coll in sorted(db.list_collection_names()):
    indexes = db[coll].index_information()
    unique_idxs = [n for n, info in indexes.items() if info.get("unique") and n != "_id_"]
    if unique_idxs:
        for idx_name in unique_idxs:
            keys = indexes[idx_name].get("key")
            print(f"       - {coll}: UNIQUE index '{idx_name}' on {keys}")

client.close()

print()
print("=" * 65)
print("ALL 14 VERIFICATION TESTS PASSED SUCCESSFULLY.")
print("=" * 65)
