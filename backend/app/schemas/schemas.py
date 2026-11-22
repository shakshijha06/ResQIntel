from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- AUTH & USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    name: str
    role: str = "reviewer"  # "admin" or "reviewer"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

# --- PUBLIC REPORT SUBMISSION & TRACKING ---
class PublicReportSubmission(BaseModel):
    disaster_type: str
    raw_location: str
    report_description: str
    observation_time: Optional[str] = None
    language: str = "en"
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    reporter_name: Optional[str] = None
    contact_info: Optional[str] = None
    supporting_evidence: Optional[str] = None

class PublicSubmissionResponse(BaseModel):
    reference_id: str
    tracking_token: str
    message: str
    received_at: str
    status: str = "under_review"

class PublicTrackingResponse(BaseModel):
    reference_id: str
    status: str
    disaster_type: str
    generalized_location: str
    received_at: str
    last_updated: str
    published_incident_id: Optional[str] = None
    status_explanation: str

# --- REPORT SCHEMAS (ADMIN / INTERNAL) ---
class ReportBase(BaseModel):
    original_text: str
    language: str = "en"
    disaster_type: str = "general_emergency"
    raw_location: Optional[str] = None
    normalized_location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    reported_at: Optional[str] = None
    received_at: Optional[str] = None
    reported_condition: Optional[str] = None
    source: str = "Public Submission"
    evidence: Optional[str] = None
    extraction_status: str = "raw"  # "raw", "extracted", "verified"
    data_origin: str = "synthetic"  # "synthetic" or "live"
    associated_incident_id: Optional[str] = None
    extracted_fields: Optional[Dict[str, Any]] = None

class ReportCreate(ReportBase):
    pass

class Report(ReportBase):
    report_id: str
    created_at: str

# --- INCIDENT SCHEMAS ---
class IncidentBase(BaseModel):
    title: str
    disaster_type: str
    disaster_subtype: Optional[str] = None
    location: str
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    associated_report_ids: List[str] = Field(default_factory=list)
    current_status: str = "under_review"  # "active", "monitoring", "resolved", "under_review", "in_progress"
    publication_status: str = "unpublished"  # "unpublished", "published"
    information_status: str = "unconfirmed"  # "unconfirmed", "partially_confirmed", "cross_referenced", "verified"
    priority: str = "normal"  # "low", "normal", "high", "urgent"
    summary: Optional[str] = None
    public_summary: Optional[str] = None
    first_observed_at: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    conflicts: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    sources: Optional[List[str]] = Field(default_factory=list)
    data_origin: str = "live_submission"
    assigned_department: Optional[str] = None
    action_updates: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class IncidentCreate(IncidentBase):
    pass

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    disaster_type: Optional[str] = None
    disaster_subtype: Optional[str] = None
    location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_status: Optional[str] = None
    publication_status: Optional[str] = None
    information_status: Optional[str] = None
    priority: Optional[str] = None
    summary: Optional[str] = None
    public_summary: Optional[str] = None
    assigned_department: Optional[str] = None

class Incident(IncidentBase):
    incident_id: str
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    published_by: Optional[str] = None

# --- REVIEW SCHEMAS ---
class ReviewDecisionCreate(BaseModel):
    decision: str  # "confirm_match", "mark_non_match", "mark_uncertain", "mark_duplicate"
    reviewer_notes: Optional[str] = None
    assigned_incident_id: Optional[str] = None

class ReviewDecision(BaseModel):
    review_id: str
    report_ids: List[str]
    suggested_decision: str
    comparison_classification: str = "possible_match"
    reasons: List[str] = Field(default_factory=list)
    location_comparison: Optional[Dict[str, Any]] = None
    timestamp_comparison: Optional[Dict[str, Any]] = None
    disaster_type_comparison: Optional[Dict[str, Any]] = None
    status: str = "pending"  # "pending", "resolved"
    reviewer_decision: Optional[str] = None
    reviewer_notes: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    created_at: str

# --- NOTIFICATION & AUDIT SCHEMAS ---
class Notification(BaseModel):
    notification_id: str
    title: str
    message: str
    category: str  # "new_report", "review_required", "review_completed", "incident_updated", "publication_changed"
    related_entity_id: Optional[str] = None
    is_read: bool = False
    created_at: str

class AuditLog(BaseModel):
    log_id: str
    user_id: str
    user_email: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    timestamp: str

# --- DASHBOARD & METRICS ---
class DashboardStats(BaseModel):
    total_submitted_reports: int
    distinct_incidents: int
    active_incidents: int
    monitoring_incidents: int
    resolved_incidents: int
    reports_pending_review: int
    potential_conflicts: int
    published_incidents: int
    languages_breakdown: Dict[str, int]
    disaster_breakdown: Dict[str, int]
    system_status: str
    database_backend: str
    ai_status: str

# --- DATASET & SYNTHETIC DATA SCHEMAS ---
class DatasetImportRequest(BaseModel):
    name: str
    source_description: Optional[str] = "Imported research disaster corpus"
    records: List[Dict[str, Any]]
    field_mapping: Optional[Dict[str, str]] = Field(default_factory=dict)

class SyntheticScenarioRequest(BaseModel):
    scenario_type: str = "duplicate_pair"  # "duplicate_pair", "update_sequence", "conflict_pair", "multilingual_trio"

class ConflictResolutionRequest(BaseModel):
    resolution_status: str  # "resolved_factual", "clarified", "dismissed_rumor", "retained_both"
    resolution_notes: str
