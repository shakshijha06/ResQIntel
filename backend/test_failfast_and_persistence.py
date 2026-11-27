import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.config import settings
from app.database import db_repo, get_repository, MongoRepository, JsonFileRepository
from app.services.emergency_service import EmergencyService
from app.schemas.schemas import IncidentUpdate, ReviewDecisionCreate

print('=' * 65)
print('COMPREHENSIVE MULTI-PHASE VERIFICATION SUITE')
print('=' * 65)

# 1. Connection failure & fail-fast validation (Phase 3)
print('Verifying fail-fast startup behavior...')
old_backend = settings.STORAGE_BACKEND
old_uri = settings.MONGODB_URI

# Test invalid backend rejection
settings.STORAGE_BACKEND = 'invalid_backend'
try:
    get_repository()
    assert False, 'Should have raised ValueError on invalid backend'
except ValueError as e:
    print('[PASS] Phase 3.1: Invalid STORAGE_BACKEND rejected with ValueError')

# Test missing URI rejection
settings.STORAGE_BACKEND = 'mongodb'
settings.MONGODB_URI = ''
try:
    get_repository()
    assert False, 'Should have raised RuntimeError on missing URI'
except RuntimeError as e:
    print('[PASS] Phase 3.2: Missing MONGODB_URI in mongodb mode fails startup (no silent fallback)')

# Test unreachable MongoDB Atlas host rejection
settings.MONGODB_URI = 'mongodb+srv://fakeuser:fakepassword@invalid-cluster.mongodb.net/?retryWrites=true&w=majority'
try:
    get_repository()
    assert False, 'Should have raised RuntimeError on unreachable Atlas'
except RuntimeError as e:
    msg = str(e)
    assert 'fakepassword' not in msg, 'Error message leaked credentials!'
    print('[PASS] Phase 3.3: Unreachable Atlas fails startup cleanly without leaking credentials')

# Restore settings
settings.STORAGE_BACKEND = old_backend
settings.MONGODB_URI = old_uri

# 2. Database restart & persistence verification across restarts (Phase 6)
service = EmergencyService()
initial_report = service.get_report_by_id('RPT-2026-0164')
assert initial_report is not None, 'Record RPT-2026-0164 not found before simulated restart'
print('[PASS] Phase 6.1: Record RPT-2026-0164 confirmed present before restart')

# Simulate application restart: re-instantiate repository and service
restarted_repo = get_repository()
assert restarted_repo.is_healthy()['connected'] == True
restarted_service = EmergencyService()
restarted_service.repo = restarted_repo

retrieved_after_restart = restarted_service.get_report_by_id('RPT-2026-0164')
assert retrieved_after_restart is not None, 'Record disappeared after restart!'
assert retrieved_after_restart['report_id'] == 'RPT-2026-0164'
print('[PASS] Phase 6.2: Application restart and data persistence test passed: RPT-2026-0164 intact')

# 3. Incident update & action log persistence (Phase 5)
inc_id = retrieved_after_restart['associated_incident_id']
update_payload = IncidentUpdate(
    current_status='in_progress',
    priority='high',
    assigned_department='Kolkata Municipal Corporation - Road Maintenance'
)
admin_user = restarted_service.get_user_by_id('USR-681AC8')
updated_inc = restarted_service.update_incident(inc_id, update_payload, admin_user)
assert updated_inc is not None
assert updated_inc['current_status'] == 'in_progress'
assert updated_inc['priority'] == 'high'
assert updated_inc['assigned_department'] == 'Kolkata Municipal Corporation - Road Maintenance'
print('[PASS] Phase 5.1: Incident update persisted in MongoDB: status=in_progress, dept assigned')

# 4. Review decision persistence test (Phase 5)
reviews = restarted_service.get_reviews(status='pending')
if reviews:
    rev_id = reviews[0]['review_id']
    dec_payload = ReviewDecisionCreate(
        decision='Near Duplicate',
        reviewer_notes='Confirmed geographic collocation via satellite check.'
    )
    resolved_rev = restarted_service.submit_review_decision(rev_id, dec_payload, admin_user)
    assert resolved_rev is not None
    assert resolved_rev['status'] == 'resolved'
    assert resolved_rev['reviewer_decision'] == 'Near Duplicate'
    print(f'[PASS] Phase 5.2: Review decision persisted in MongoDB for review_id={rev_id}')
else:
    print('[SKIP] Phase 5.2: No pending reviews to resolve')

# 5. Verify Audit Logs & Notifications count increase
audits = restarted_service.get_audit_logs()
total_audits = audits['total']
assert total_audits >= 28, f'Audit logs not persisted properly: {total_audits}'
print(f'[PASS] Phase 5.3: Audit logs persisted in MongoDB ({total_audits} total records)')

# 6. Verify User Integrity - Admin USR-681AC8 preserved, 0 duplicates
all_users = restarted_service.get_all_users()
assert len(all_users) == 1, f'Expected 1 user, found {len(all_users)}'
assert all_users[0]['user_id'] == 'USR-681AC8'
assert all_users[0]['email'] == 'admin@resqintel.org'
print('[PASS] Phase 4.1: USR-681AC8 intact, zero duplicate users exist')

print('=' * 65)
print('ALL REMAINING PERSISTENCE & FAIL-FAST TESTS PASSED.')
print('=' * 65)
