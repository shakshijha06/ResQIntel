from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, status
from typing import Optional, List, Dict, Any
import json
import csv
import io
from app.services.emergency_service import emergency_service
from app.services.ai_service import ai_service, AIExtractionRequest, AIExtractionResponse, AIReviewAnalysis
from app.services.dataset_service import dataset_service
from app.services.reconciliation_engine import reconciliation_engine
from app.schemas.schemas import (
    LoginRequest, TokenResponse, UserCreate, UserResponse, ChangePasswordRequest,
    PublicReportSubmission, PublicSubmissionResponse, PublicTrackingResponse,
    IncidentUpdate, ReviewDecisionCreate, DashboardStats,
    DatasetImportRequest, SyntheticScenarioRequest, ConflictResolutionRequest
)
from app.utils.security import (
    create_access_token,
    check_login_rate_limit,
    record_failed_login,
    clear_failed_logins
)
from app.utils.dependencies import get_current_user, require_admin, require_reviewer_or_admin

api_router = APIRouter()

# ==========================================
# 1. SYSTEM HEALTH & DIAGNOSTICS
# ==========================================
@api_router.get("/health")
def health_check():
    health = emergency_service.repo.is_healthy()
    return {
        "status": "healthy",
        "service": "ResQIntel Intelligence Core",
        "version": "2.0.0",
        "database": health,
        "gemini_ai": {
            "configured": ai_service.is_configured,
            "model": ai_service.model_name
        }
    }

# ==========================================
# 2. AUTHENTICATION & USER MANAGEMENT
# ==========================================
@api_router.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest):
    # Rate limit check (generic error — does not reveal whether account exists)
    allowed, seconds_remaining = check_login_rate_limit(req.email.lower())
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {seconds_remaining} seconds before trying again."
        )

    user = emergency_service.authenticate_user(req.email, req.password)
    if not user:
        record_failed_login(req.email.lower())
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email and password."
        )

    # Successful login — clear any recorded failures
    clear_failed_logins(req.email.lower())

    token = create_access_token({"sub": user["user_id"], "role": user["role"], "email": user["email"]})
    user_out = UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    return TokenResponse(access_token=token, user=user_out)

@api_router.get("/auth/me", response_model=UserResponse)
def get_me(user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )

@api_router.post("/auth/change-password")
def change_password(req: ChangePasswordRequest, user: Dict[str, Any] = Depends(get_current_user)):
    success = emergency_service.change_password(user["user_id"], req.old_password, req.new_password)
    if not success:
        raise HTTPException(status_code=400, detail="Current password incorrect.")
    return {"status": "success", "message": "Password changed successfully."}

@api_router.get("/admin/users", response_model=List[UserResponse])
def list_users(admin: Dict[str, Any] = Depends(require_admin)):
    return emergency_service.get_all_users()

@api_router.post("/admin/users", response_model=UserResponse)
def create_reviewer(user_in: UserCreate, admin: Dict[str, Any] = Depends(require_admin)):
    try:
        return emergency_service.create_reviewer_user(user_in, admin)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.patch("/admin/users/{user_id}/status")
def toggle_user_status(user_id: str, is_active: bool, admin: Dict[str, Any] = Depends(require_admin)):
    updated = emergency_service.toggle_user_active(user_id, is_active, admin)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"status": "success", "user_id": user_id, "is_active": is_active}

# ==========================================
# 3. PUBLIC PORTAL ENDPOINTS
# ==========================================
@api_router.post("/public/reports", response_model=PublicSubmissionResponse, status_code=201)
def submit_public_report(submission: PublicReportSubmission):
    return emergency_service.submit_public_report(submission)

@api_router.get("/public/track/{reference_id}", response_model=PublicTrackingResponse)
def track_public_submission(reference_id: str, token: str = Query(...)):
    res = emergency_service.track_submission(reference_id, token)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching submission found for the provided reference ID and security token."
        )
    return res

@api_router.get("/public/incidents")
def list_public_incidents(
    disaster_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    dtypes = [disaster_type] if disaster_type and disaster_type != "all" else None
    return emergency_service.get_incidents(
        disaster_types=dtypes,
        operational_status=status if status != "all" else None,
        state=state if state != "all" else None,
        district=district if district != "all" else None,
        search=search,
        public_only=True
    )

@api_router.get("/public/incidents/{incident_id}")
def get_public_incident_detail(incident_id: str):
    inc = emergency_service.get_incident_by_id(incident_id, public_view=True)
    if not inc:
        raise HTTPException(status_code=404, detail="Published incident not found or unpublished.")
    return inc

# ==========================================
# 4. ADMIN DASHBOARD & INCIDENT MANAGEMENT
# ==========================================
@api_router.get("/admin/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    return emergency_service.get_dashboard_stats()

@api_router.get("/admin/incidents")
def list_admin_incidents(
    disaster_type: Optional[str] = Query(None),
    disaster_types: Optional[List[str]] = Query(None),
    operational_status: Optional[str] = Query(None),
    publication_status: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    # Merge single disaster_type and multi-value disaster_types list (AND within group = OR across selected types)
    resolved_types: Optional[List[str]] = None
    if disaster_type and disaster_type not in ("all", ""):
        resolved_types = [disaster_type]
    elif disaster_types:
        resolved_types = [dt for dt in disaster_types if dt and dt not in ("all", "")]
    if not resolved_types:
        resolved_types = None

    return emergency_service.get_incidents(
        disaster_types=resolved_types,
        operational_status=operational_status if operational_status != "all" else None,
        publication_status=publication_status if publication_status != "all" else None,
        state=state if state != "all" else None,
        district=district if district != "all" else None,
        search=search,
        public_only=False
    )

@api_router.get("/admin/incidents/{incident_id}")
def get_admin_incident_detail(incident_id: str, user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    inc = emergency_service.get_incident_by_id(incident_id, public_view=False)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return inc

@api_router.patch("/admin/incidents/{incident_id}")
def update_incident_record(
    incident_id: str,
    updates: IncidentUpdate,
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    # Only admins can publish or unpublish
    if updates.publication_status and user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only administrators possess permission to modify publication state."
        )
    updated = emergency_service.update_incident(incident_id, updates, user)
    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return updated

# ==========================================
# 5. ADMIN REPORTS REPOSITORY
# ==========================================
@api_router.get("/admin/reports")
def list_admin_reports(
    language: Optional[str] = Query(None),
    disaster_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    return emergency_service.get_reports(
        language=language,
        disaster_type=disaster_type,
        status=status,
        state=state,
        search=search,
        limit=limit
    )

@api_router.get("/admin/reports/{report_id}")
def get_report_detail(report_id: str, user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    rep = emergency_service.get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
    return rep

# ==========================================
# 6. HUMAN REVIEW CENTRE & RECONCILIATION
# ==========================================
@api_router.get("/admin/reviews")
def list_reviews(status: Optional[str] = Query(None), user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    return emergency_service.get_reviews(status=status)

@api_router.post("/admin/reviews/{review_id}/decision")
def submit_review_decision(
    review_id: str,
    decision: ReviewDecisionCreate,
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    updated = emergency_service.submit_review_decision(review_id, decision, user)
    if not updated:
        raise HTTPException(status_code=404, detail="Review item not found.")
    return updated

# ==========================================
# 7. AI EXTRACTION ENDPOINT (GEMINI 2.5 FLASH)
# ==========================================
@api_router.post("/admin/ai/extract", response_model=AIExtractionResponse)
def ai_extract_preview(req: AIExtractionRequest, user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    return ai_service.extract_report_info(req)

@api_router.post("/admin/reviews/{review_id}/ai-analysis", response_model=AIReviewAnalysis)
def get_ai_review_analysis(review_id: str, user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    """Run structured AI comparison on a review pair using Gemini 2.5 Flash."""
    reviews = emergency_service.get_reviews()
    review = next((r for r in reviews if r.get("review_id") == review_id), None)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
    reports = review.get("reports", [])
    if len(reports) < 2:
        raise HTTPException(status_code=422, detail="Review does not contain two reports for comparison.")
    return ai_service.analyze_review_pair(reports[0], reports[1])

# ==========================================
# 8. NOTIFICATIONS & ALERTS
# ==========================================
@api_router.get("/admin/notifications")
def get_notifications(unread_only: bool = Query(False), user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    return emergency_service.get_notifications(unread_only=unread_only)

@api_router.patch("/admin/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    success = emergency_service.mark_notification_read(notification_id)
    return {"status": "success", "marked": success}

@api_router.post("/admin/notifications/mark-all-read")
def mark_all_notifications_read(user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    count = emergency_service.mark_all_notifications_read()
    return {"status": "success", "count": count}

# ==========================================
# 9. AUDIT LOGS
# ==========================================
@api_router.get("/admin/audit-logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(require_admin)
):
    """Return paginated audit logs. Admin-only."""
    logs = emergency_service.get_audit_logs(
        action=action,
        entity_type=entity_type,
        user_email=user_email,
        page=page,
        page_size=page_size
    )
    return logs

# ==========================================
# 10. REPORT PROCESSING PIPELINE
# ==========================================
@api_router.post("/admin/reports/{report_id}/process")
def trigger_report_processing(
    report_id: str,
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    """Trigger AI extraction pipeline for a specific report."""
    rep = emergency_service.get_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found.")
    result = emergency_service.process_report_extraction(report_id, user)
    return result

# ==========================================
# 11. PUBLIC REPORTS (read-only, filtered)
# ==========================================
@api_router.get("/public/reports")
def list_public_reports(
    disaster_type: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """Return public-facing reports (live_submission only, excluding synthetic and sensitive fields)."""
    return emergency_service.get_public_reports(
        disaster_type=disaster_type,
        state=state,
        district=district,
        search=search,
        page=page,
        page_size=page_size
    )

@api_router.get("/public/reports/{report_id}")
def get_public_report_detail(report_id: str):
    """Return a single public report detail (safe fields only)."""
    rep = emergency_service.get_public_report_by_id(report_id)
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found or not publicly available.")
    return rep

# ==========================================
# 12. DATASET MANAGEMENT
# ==========================================
@api_router.get("/admin/datasets")
def list_datasets(user: Dict[str, Any] = Depends(require_admin)):
    return dataset_service.get_all_datasets()

@api_router.post("/admin/datasets/preview-csv")
async def preview_dataset_csv(file: UploadFile = File(...), user: Dict[str, Any] = Depends(require_admin)):
    if not file.filename.endswith(('.csv', '.txt')):
        raise HTTPException(status_code=400, detail="Only CSV or formatted text files are supported.")
    contents = await file.read()
    try:
        text = contents.decode('utf-8')
    except UnicodeDecodeError:
        text = contents.decode('latin-1')
    return dataset_service.preview_csv_records(text, max_rows=5)

@api_router.post("/admin/datasets/import")
def import_dataset_records(req: DatasetImportRequest, user: Dict[str, Any] = Depends(require_admin)):
    result = dataset_service.import_dataset(
        name=req.name,
        source_description=req.source_description or "Imported research corpus",
        records=req.records,
        field_mapping=req.field_mapping or {},
        user=user
    )
    emergency_service.create_audit_log(
        user_id=user["user_id"],
        user_email=user["email"],
        action="import_dataset",
        entity_type="dataset",
        entity_id=result["dataset_id"],
        details=f"Imported dataset '{req.name}': {result['imported_count']} records loaded."
    )
    return result

@api_router.delete("/admin/datasets/{dataset_id}")
def remove_dataset(dataset_id: str, user: Dict[str, Any] = Depends(require_admin)):
    success = dataset_service.delete_dataset(dataset_id, user)
    emergency_service.create_audit_log(
        user_id=user["user_id"],
        user_email=user["email"],
        action="delete_dataset",
        entity_type="dataset",
        entity_id=dataset_id,
        details=f"Purged dataset {dataset_id} and associated imported records."
    )
    return {"status": "success", "message": f"Dataset {dataset_id} removed."}

# ==========================================
# 13. SYNTHETIC DATA MANAGEMENT
# ==========================================
@api_router.get("/admin/synthetic-data/summary")
def get_synthetic_summary(user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    all_reports = emergency_service.repo.get_all("reports")
    all_reviews = emergency_service.repo.get_all("reviews")
    syn_reports = [r for r in all_reports if r.get("data_origin") == "synthetic"]
    syn_reviews = [rv for rv in all_reviews if rv.get("data_origin") == "synthetic"]
    return {
        "synthetic_reports_count": len(syn_reports),
        "synthetic_reviews_count": len(syn_reviews),
        "available_scenarios": [
            {"id": "duplicate_pair", "name": "Exact Duplicate Flood Breach", "category": "Duplicate Detection"},
            {"id": "update_sequence", "name": "Urban Flood Progressive Timeline", "category": "Update Detection"},
            {"id": "conflict_pair", "name": "Contradictory Road Passability", "category": "Conflict Detection"},
            {"id": "multilingual_trio", "name": "Multilingual Landslide Cluster (EN, HI, BN)", "category": "Multilingual Intelligence"}
        ]
    }

@api_router.post("/admin/synthetic-data/generate")
def generate_synthetic_data(req: SyntheticScenarioRequest, user: Dict[str, Any] = Depends(require_admin)):
    res = dataset_service.generate_synthetic_scenario(req.scenario_type, user)
    emergency_service.create_audit_log(
        user_id=user["user_id"],
        user_email=user["email"],
        action="generate_synthetic_scenario",
        entity_type="synthetic_data",
        entity_id=res["scenario_id"],
        details=f"Generated {res['scenario_type']} ({res['reports_generated']} records)."
    )
    return res

@api_router.delete("/admin/synthetic-data/reset")
def reset_synthetic_data(user: Dict[str, Any] = Depends(require_admin)):
    res = dataset_service.reset_synthetic_data()
    emergency_service.create_audit_log(
        user_id=user["user_id"],
        user_email=user["email"],
        action="reset_synthetic_data",
        entity_type="synthetic_data",
        entity_id="ALL_SYNTHETIC",
        details=f"Purged {res['deleted_synthetic_reports']} synthetic reports and {res['deleted_synthetic_reviews']} synthetic reviews."
    )
    return res

# ==========================================
# 14. CONFLICTS REVIEW WORKSPACE
# ==========================================
@api_router.get("/admin/conflicts")
def list_conflicts(user: Dict[str, Any] = Depends(require_reviewer_or_admin)):
    """Collate identified contradictions from reviews and incidents."""
    incidents = emergency_service.repo.get_all("incidents")
    reviews = emergency_service.repo.get_all("reviews")
    reports_map = {r["report_id"]: r for r in emergency_service.repo.get_all("reports")}

    conflict_items = []

    # Conflicts from reviews marked as potential_contradiction
    for rv in reviews:
        if rv.get("comparison_classification") in ("potential_contradiction", "conflict") or "Conflict" in str(rv.get("suggested_decision", "")):
            r_ids = rv.get("report_ids", [])
            reps = [reports_map.get(rid) for rid in r_ids if rid in reports_map]
            conflict_items.append({
                "conflict_id": rv["review_id"],
                "source_type": "review_candidate",
                "title": f"Contradiction between {', '.join(r_ids)}",
                "status": "resolved" if rv.get("status") == "resolved" else "unresolved",
                "disaster_type": reps[0].get("disaster_type") if reps else "general",
                "location": rv.get("location_comparison", {}).get("report_a") if rv.get("location_comparison") else "Collocated sector",
                "reasons": rv.get("reasons", []),
                "reports": reps,
                "reviewed_decision": rv.get("reviewer_decision"),
                "reviewed_notes": rv.get("reviewer_notes"),
                "created_at": rv.get("created_at")
            })

    # Conflicts listed in incidents
    for inc in incidents:
        for c in (inc.get("conflicts") or []):
            conflict_items.append({
                "conflict_id": f"INC-CONF-{inc['incident_id'][-4:]}",
                "source_type": "incident_dossier",
                "incident_id": inc["incident_id"],
                "title": inc.get("title"),
                "status": "under_investigation",
                "disaster_type": inc.get("disaster_type"),
                "location": f"{inc.get('location')} ({inc.get('state')})",
                "reasons": [c.get("field", "Field disparity") + ": " + c.get("note", "Discrepancy noted in field claims")],
                "reports": [],
                "created_at": inc.get("updated_at")
            })

    return conflict_items

# ==========================================
# 15. DYNAMIC RECONCILIATION ENGINE
# ==========================================
@api_router.post("/admin/reconciliation/compare")
def compare_reports_dynamic(
    report_id_a: str = Query(...),
    report_id_b: str = Query(...),
    user: Dict[str, Any] = Depends(require_reviewer_or_admin)
):
    """Run full 12-stage multi-signal reconciliation on any two reports on-the-fly."""
    rep_a = emergency_service.get_report_by_id(report_id_a)
    rep_b = emergency_service.get_report_by_id(report_id_b)
    if not rep_a or not rep_b:
        raise HTTPException(status_code=404, detail="One or both reports could not be found.")

    analysis = reconciliation_engine.analyze_pair(rep_a, rep_b)
    return {
        "report_a": rep_a,
        "report_b": rep_b,
        "analysis": analysis
    }

