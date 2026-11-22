import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.database import db_repo
from app.config import settings
from app.utils.security import hash_password, verify_password, create_access_token
from app.schemas.schemas import (
    UserCreate, PublicReportSubmission, PublicSubmissionResponse,
    PublicTrackingResponse, IncidentCreate, IncidentUpdate,
    ReviewDecisionCreate, DashboardStats
)

class EmergencyService:
    def __init__(self):
        self.repo = db_repo
        self._ensure_bootstrap_admin()

    def _ensure_bootstrap_admin(self):
        """Ensures the initial administrator account exists."""
        admin = self.repo.find_one("users", {"email": settings.BOOTSTRAP_ADMIN_EMAIL})
        if not admin:
            admin_user = {
                "user_id": f"USR-{uuid.uuid4().hex[:6].upper()}",
                "email": settings.BOOTSTRAP_ADMIN_EMAIL,
                "name": settings.BOOTSTRAP_ADMIN_NAME,
                "role": "admin",
                "hashed_password": hash_password(settings.BOOTSTRAP_ADMIN_PASSWORD),
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            self.repo.insert("users", admin_user)

    # --- USER AUTHENTICATION & MANAGEMENT ---
    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        user = self.repo.find_one("users", {"email": email})
        if not user or not user.get("is_active", True):
            return None
        if not verify_password(password, user["hashed_password"]):
            return None
        return user

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_by_id("users", "user_id", user_id)

    def get_all_users(self) -> List[Dict[str, Any]]:
        users = self.repo.get_all("users")
        clean_users = []
        for u in users:
            u_copy = u.copy()
            u_copy.pop("hashed_password", None)
            clean_users.append(u_copy)
        return clean_users

    def create_reviewer_user(self, user_in: UserCreate, created_by_admin: Dict[str, Any]) -> Dict[str, Any]:
        existing = self.repo.find_one("users", {"email": user_in.email})
        if existing:
            raise ValueError(f"User with email {user_in.email} already exists.")
        
        user_doc = {
            "user_id": f"USR-{uuid.uuid4().hex[:6].upper()}",
            "email": user_in.email,
            "name": user_in.name,
            "role": user_in.role if user_in.role in ["reviewer", "admin"] else "reviewer",
            "hashed_password": hash_password(user_in.password),
            "is_active": user_in.is_active,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        saved = self.repo.insert("users", user_doc)
        self.create_audit_log(
            user_id=created_by_admin["user_id"],
            user_email=created_by_admin["email"],
            action="create_user",
            entity_type="user",
            entity_id=saved["user_id"],
            details=f"Created {user_doc['role']} account for {user_doc['email']}"
        )
        saved_copy = saved.copy()
        saved_copy.pop("hashed_password", None)
        return saved_copy

    def toggle_user_active(self, target_user_id: str, is_active: bool, admin: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        updated = self.repo.update("users", "user_id", target_user_id, {"is_active": is_active})
        if updated:
            self.create_audit_log(
                user_id=admin["user_id"],
                user_email=admin["email"],
                action="toggle_user_status",
                entity_type="user",
                entity_id=target_user_id,
                details=f"Set user active status to {is_active}"
            )
            updated.pop("hashed_password", None)
        return updated

    def change_password(self, user_id: str, old_pw: str, new_pw: str) -> bool:
        user = self.repo.get_by_id("users", "user_id", user_id)
        if not user or not verify_password(old_pw, user["hashed_password"]):
            return False
        self.repo.update("users", "user_id", user_id, {"hashed_password": hash_password(new_pw)})
        return True

    # --- PUBLIC SUBMISSION & SECURE TRACKING ---
    def submit_public_report(self, sub: PublicReportSubmission) -> PublicSubmissionResponse:
        import math
        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate sequential reference ID: RPT-YYYY-NNNN
        all_reports_existing = self.repo.get_all("reports")
        year = datetime.now(timezone.utc).year
        next_num = len(all_reports_existing) + 1
        ref_id = f"RPT-{year}-{next_num:04d}"

        tracking_token = uuid.uuid4().hex
        token_hash = hashlib.sha256(tracking_token.encode('utf-8')).hexdigest()

        # Save to reports collection
        report_record = {
            "report_id": ref_id,
            "original_text": sub.report_description,
            "language": sub.language or "en",
            "disaster_type": sub.disaster_type,
            "raw_location": sub.raw_location,
            "normalized_location": sub.raw_location,
            "state": sub.state or "",
            "district": sub.district or "",
            "city": sub.city or "",
            "latitude": sub.latitude,
            "longitude": sub.longitude,
            "reported_at": sub.observation_time or now_iso,
            "received_at": now_iso,
            "reported_condition": "Submitted — awaiting review",
            "source": "Public Community Portal",
            "evidence": sub.supporting_evidence,
            "extraction_status": "raw",
            "data_origin": "live_submission",
            "associated_incident_id": None,
            "reporter_name": sub.reporter_name or "Anonymous",
            "contact_info": sub.contact_info or "",
            "created_at": now_iso
        }
        self.repo.insert("reports", report_record)

        # --- AUTO INCIDENT ASSOCIATION ---
        # Try to find an existing incident with the same category near the same location
        all_incidents = self.repo.get_all("incidents")
        matched_incident = None

        for inc in all_incidents:
            # Must match category
            if inc.get("disaster_type") != sub.disaster_type:
                continue
            # Skip synthetic/demo incidents for auto-matching
            if inc.get("data_origin") in ("synthetic", "demo_seed"):
                continue
            # Coordinate proximity check (within 2 km)
            inc_lat = inc.get("latitude")
            inc_lng = inc.get("longitude")
            if sub.latitude and sub.longitude and inc_lat and inc_lng:
                try:
                    dlat = math.radians(float(sub.latitude) - float(inc_lat))
                    dlng = math.radians(float(sub.longitude) - float(inc_lng))
                    a = (math.sin(dlat / 2) ** 2 +
                         math.cos(math.radians(float(inc_lat))) *
                         math.cos(math.radians(float(sub.latitude))) *
                         math.sin(dlng / 2) ** 2)
                    dist_km = 6371 * 2 * math.asin(math.sqrt(max(0, min(1, a))))
                    if dist_km <= 2.0:
                        matched_incident = inc
                        break
                except (ValueError, TypeError):
                    pass
            elif (inc.get("state") == sub.state and
                  inc.get("district") == sub.district and
                  sub.state and sub.district):
                matched_incident = inc
                break

        if matched_incident:
            # Associate with existing incident
            inc_id = matched_incident["incident_id"]
            existing_ids = list(matched_incident.get("associated_report_ids", []))
            if ref_id not in existing_ids:
                existing_ids.append(ref_id)
                self.repo.update("incidents", "incident_id", inc_id, {
                    "associated_report_ids": existing_ids,
                    "report_count": len(existing_ids),
                    "updated_at": now_iso
                })
            self.repo.update("reports", "report_id", ref_id, {"associated_incident_id": inc_id})
            linked_incident_id = inc_id
        else:
            # Create new provisional incident
            inc_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
            category_label = sub.disaster_type.replace("_", " ").title()
            location_label = sub.raw_location or sub.city or sub.district or sub.state or "Location not specified"
            new_incident = {
                "incident_id": inc_id,
                "title": f"{category_label} — {location_label}",
                "disaster_type": sub.disaster_type,
                "location": location_label,
                "state": sub.state or "",
                "district": sub.district or "",
                "city": sub.city or "",
                "latitude": sub.latitude,
                "longitude": sub.longitude,
                "current_status": "under_review",
                "publication_status": "unpublished",
                "priority": "normal",
                "summary": (sub.report_description or "")[:300],
                "public_summary": "",
                "associated_report_ids": [ref_id],
                "report_count": 1,
                "data_origin": "live_submission",
                "assigned_department": None,
                "action_updates": [],
                "created_at": now_iso,
                "updated_at": now_iso
            }
            self.repo.insert("incidents", new_incident)
            self.repo.update("reports", "report_id", ref_id, {"associated_incident_id": inc_id})
            linked_incident_id = inc_id

        # Save secure submission tracking record
        tracking_record = {
            "reference_id": ref_id,
            "token_hash": token_hash,
            "status": "under_review",
            "disaster_type": sub.disaster_type,
            "generalized_location": sub.state or sub.city or "Location submitted",
            "reporter_name_masked": f"{sub.reporter_name[:1]}***" if sub.reporter_name else "Anonymous",
            "received_at": now_iso,
            "last_updated": now_iso,
            "published_incident_id": linked_incident_id,
            "status_explanation": "Your report has been received and is under review. Similar reports may be grouped together."
        }
        self.repo.insert("submission_tracking", tracking_record)

        # Create system notification for operations team
        self.create_notification(
            title="New Public Report Submitted",
            message=f"Report {ref_id} ({sub.disaster_type.replace('_', ' ')}) at {sub.raw_location or sub.city or sub.state}",
            category="new_report",
            related_entity_id=ref_id
        )

        return PublicSubmissionResponse(
            reference_id=ref_id,
            tracking_token=tracking_token,
            message="Your report has been received. Save your reference number to track its progress.",
            received_at=now_iso,
            status="under_review"
        )

    def track_submission(self, ref_id: str, tracking_token: str) -> Optional[PublicTrackingResponse]:
        provided_hash = hashlib.sha256(tracking_token.strip().encode('utf-8')).hexdigest()
        track_doc = self.repo.get_by_id("submission_tracking", "reference_id", ref_id.strip())
        if not track_doc:
            return None
        if track_doc.get("token_hash") != provided_hash:
            return None

        return PublicTrackingResponse(
            reference_id=track_doc["reference_id"],
            status=track_doc["status"],
            disaster_type=track_doc["disaster_type"],
            generalized_location=track_doc.get("generalized_location", "Local area"),
            received_at=track_doc["received_at"],
            last_updated=track_doc["last_updated"],
            published_incident_id=track_doc.get("published_incident_id"),
            status_explanation=track_doc["status_explanation"]
        )

    # --- DASHBOARD & METRICS ---
    def get_dashboard_stats(self) -> DashboardStats:
        reports = self.repo.get_all("reports")
        incidents = self.repo.get_all("incidents")
        reviews = self.repo.get_all("reviews")

        lang_counts = {}
        for r in reports:
            lang = r.get("language", "en")
            lang_counts[lang] = lang_counts.get(lang, 0) + 1

        disaster_counts = {}
        for inc in incidents:
            dt = inc.get("disaster_type", "general")
            disaster_counts[dt] = disaster_counts.get(dt, 0) + 1

        active_cnt = sum(1 for i in incidents if i.get("current_status") == "active")
        monitoring_cnt = sum(1 for i in incidents if i.get("current_status") == "monitoring")
        resolved_cnt = sum(1 for i in incidents if i.get("current_status") == "resolved")
        published_cnt = sum(1 for i in incidents if i.get("publication_status") == "published")
        pending_rev_cnt = sum(1 for rv in reviews if rv.get("status") == "pending")

        potential_conflicts = 0
        for inc in incidents:
            if inc.get("conflicts"):
                potential_conflicts += len(inc["conflicts"])

        health = self.repo.is_healthy()
        db_mode = f"MongoDB Atlas ({health.get('database')})" if health.get("backend") == "mongodb" else "Local Persistent JSON"

        return DashboardStats(
            total_submitted_reports=len(reports),
            distinct_incidents=len(incidents),
            active_incidents=active_cnt,
            monitoring_incidents=monitoring_cnt,
            resolved_incidents=resolved_cnt,
            reports_pending_review=pending_rev_cnt,
            potential_conflicts=potential_conflicts,
            published_incidents=published_cnt,
            languages_breakdown=lang_counts,
            disaster_breakdown=disaster_counts,
            system_status="Operational",
            database_backend=db_mode,
            ai_status="Google Gemini 2.5 Flash Connected" if settings.GEMINI_API_KEY else "Dormant (Ready for Key)"
        )

    # --- INCIDENTS (ADMIN & PUBLIC) ---
    def get_incidents(
        self,
        disaster_types: Optional[List[str]] = None,
        operational_status: Optional[str] = None,
        publication_status: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None,
        public_only: bool = False
    ) -> List[Dict[str, Any]]:
        all_incidents = self.repo.get_all("incidents")
        filtered = []

        for inc in all_incidents:
            # Public users can only see published incidents
            if public_only and inc.get("publication_status") != "published":
                continue
            if not public_only and publication_status and inc.get("publication_status") != publication_status:
                continue
            if operational_status and inc.get("current_status") != operational_status:
                continue
            if disaster_types:
                if inc.get("disaster_type") not in disaster_types and inc.get("disaster_subtype") not in disaster_types:
                    continue
            if state and inc.get("state") and inc.get("state").lower() != state.lower():
                continue
            if district and inc.get("district") and inc.get("district").lower() != district.lower():
                continue
            if search:
                q = search.lower()
                title_match = q in inc.get("title", "").lower()
                loc_match = q in inc.get("location", "").lower()
                state_match = q in (inc.get("state") or "").lower()
                summary_match = q in (inc.get("summary") or "").lower()
                if not (title_match or loc_match or state_match or summary_match):
                    continue

            filtered.append(inc)

        filtered.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return filtered

    def get_incident_by_id(self, incident_id: str, public_view: bool = False) -> Optional[Dict[str, Any]]:
        inc = self.repo.get_by_id("incidents", "incident_id", incident_id)
        if not inc:
            return None
        if public_view and inc.get("publication_status") != "published":
            return None

        inc_copy = inc.copy()
        if not public_view:
            # Enrich with actual report objects for operations team
            rep_ids = inc.get("associated_report_ids", [])
            all_reports = self.repo.get_all("reports")
            reports_map = {r["report_id"]: r for r in all_reports}
            # Defensive: only include IDs that actually resolve to real reports
            associated_reports = [reports_map[rid] for rid in rep_ids if rid in reports_map]
            inc_copy["associated_reports"] = associated_reports
            # Fix count to match reality
            inc_copy["report_count"] = len(associated_reports)
            inc_copy["associated_report_ids"] = [r["report_id"] for r in associated_reports]
        else:
            # Redact internal confidential fields for public consumers
            inc_copy.pop("conflicts", None)
            inc_copy.pop("associated_report_ids", None)
        return inc_copy

    def update_incident(self, incident_id: str, updates: IncidentUpdate, user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        now_iso = datetime.now(timezone.utc).isoformat()
        update_data["updated_at"] = now_iso

        if update_data.get("publication_status") == "published":
            update_data["published_at"] = now_iso
            update_data["published_by"] = user["name"]

        updated = self.repo.update("incidents", "incident_id", incident_id, update_data)
        if updated:
            self.create_audit_log(
                user_id=user["user_id"],
                user_email=user["email"],
                action="update_incident",
                entity_type="incident",
                entity_id=incident_id,
                details=f"Updated incident fields: {list(update_data.keys())}"
            )
            self.create_notification(
                title="Incident Updated",
                message=f"Incident {incident_id} updated ({update_data.get('current_status', 'Status unchanged')})",
                category="incident_updated",
                related_entity_id=incident_id
            )
        return updated

    # --- REPORTS (ADMIN / OPERATIONS) ---
    def get_reports(
        self,
        language: Optional[str] = None,
        disaster_type: Optional[str] = None,
        status: Optional[str] = None,
        state: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 200
    ) -> List[Dict[str, Any]]:
        all_reports = self.repo.get_all("reports")
        filtered = []

        for r in all_reports:
            if language and language != "all" and r.get("language") != language:
                continue
            if disaster_type and disaster_type != "all" and r.get("disaster_type") != disaster_type:
                continue
            if status and status != "all" and r.get("extraction_status") != status:
                continue
            if state and state != "all" and r.get("state") and r.get("state").lower() != state.lower():
                continue
            if search:
                q = search.lower()
                text_match = q in r.get("original_text", "").lower()
                loc_match = q in (r.get("raw_location") or "").lower() or q in (r.get("state") or "").lower()
                src_match = q in r.get("source", "").lower()
                id_match = q in r.get("report_id", "").lower()
                if not (text_match or loc_match or src_match or id_match):
                    continue
            filtered.append(r)

        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return filtered[:limit]

    def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_by_id("reports", "report_id", report_id)

    # --- REVIEWS & RECONCILIATION ---
    def get_reviews(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        reviews = self.repo.get_all("reviews")
        reports_map = {r["report_id"]: r for r in self.repo.get_all("reports")}
        enriched = []

        for rev in reviews:
            if status and rev.get("status") != status:
                continue
            rev_copy = rev.copy()
            rev_copy["reports"] = [reports_map.get(rid) for rid in rev.get("report_ids", []) if rid in reports_map]
            enriched.append(rev_copy)

        enriched.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return enriched

    def submit_review_decision(self, review_id: str, dec: ReviewDecisionCreate, user: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        now_iso = datetime.now(timezone.utc).isoformat()
        updates = {
            "status": "resolved",
            "reviewer_decision": dec.decision,
            "reviewer_notes": dec.reviewer_notes,
            "reviewed_by": user["name"],
            "reviewed_at": now_iso
        }
        updated = self.repo.update("reviews", "review_id", review_id, updates)
        if updated:
            self.create_audit_log(
                user_id=user["user_id"],
                user_email=user["email"],
                action="submit_review_decision",
                entity_type="review",
                entity_id=review_id,
                details=f"Decision: {dec.decision}. Notes: {dec.reviewer_notes}"
            )
            self.create_notification(
                title="Review Decision Completed",
                message=f"Review case {review_id} resolved by {user['name']}: {dec.decision}",
                category="review_completed",
                related_entity_id=review_id
            )
        return updated

    # --- NOTIFICATIONS & AUDIT LOGS ---
    def get_notifications(self, unread_only: bool = False, limit: int = 25) -> List[Dict[str, Any]]:
        notes = self.repo.get_all("notifications")
        if unread_only:
            notes = [n for n in notes if not n.get("is_read", False)]
        notes.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return notes[:limit]

    def mark_notification_read(self, notification_id: str) -> bool:
        return bool(self.repo.update("notifications", "notification_id", notification_id, {"is_read": True}))

    def mark_all_notifications_read(self) -> int:
        notes = self.repo.get_all("notifications")
        count = 0
        for n in notes:
            if not n.get("is_read", False):
                self.repo.update("notifications", "notification_id", n["notification_id"], {"is_read": True})
                count += 1
        return count

    def create_notification(self, title: str, message: str, category: str, related_entity_id: Optional[str] = None):
        note = {
            "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            "title": title,
            "message": message,
            "category": category,
            "related_entity_id": related_entity_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.repo.insert("notifications", note)

    def create_audit_log(self, user_id: str, user_email: str, action: str, entity_type: str, entity_id: str, details: Optional[str] = None):
        log = {
            "log_id": f"AUD-{uuid.uuid4().hex[:8].upper()}",
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.repo.insert("audit_logs", log)

    def get_audit_logs(
        self,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        user_email: Optional[str] = None,
        page: int = 1,
        page_size: int = 50
    ) -> Dict[str, Any]:
        """Return paginated audit logs with optional filters."""
        logs = self.repo.get_all("audit_logs")
        filtered = []
        for log in logs:
            if action and log.get("action") != action:
                continue
            if entity_type and log.get("entity_type") != entity_type:
                continue
            if user_email and user_email.lower() not in (log.get("user_email") or "").lower():
                continue
            filtered.append(log)

        filtered.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, -(-total // page_size)),
            "logs": filtered[start:end]
        }

    def process_report_extraction(self, report_id: str, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger AI extraction on a single report and store the extracted fields.
        Original text is never modified.
        """
        from app.services.ai_service import ai_service, AIExtractionRequest
        rep = self.repo.get_by_id("reports", "report_id", report_id)
        if not rep:
            return {"status": "error", "message": "Report not found."}

        original_text = rep.get("original_text", "")
        if not original_text.strip():
            return {"status": "error", "message": "Report has no text to extract from."}

        req = AIExtractionRequest(
            raw_text=original_text,
            language_hint=rep.get("language", "en"),
            source_hint=rep.get("source", "")
        )
        result = ai_service.extract_report_info(req)

        now_iso = datetime.now(timezone.utc).isoformat()
        updates: Dict[str, Any] = {
            "extraction_status": "extracted" if result.is_success else "extraction_failed",
            "extraction_attempted_at": now_iso,
            "extraction_provider": result.ai_provider
        }

        if result.is_success:
            extracted_fields = {
                "disaster_type": result.extracted_disaster_type,
                "disaster_subtype": result.extracted_disaster_subtype,
                "location": result.extracted_location,
                "state": result.state,
                "district": result.district,
                "city": result.city,
                "observation_time": result.observation_time,
                "reported_condition": result.reported_condition,
                "severity_indicators": result.severity_indicators,
                "entities": result.entities or [],
            }
            updates["extracted_fields"] = extracted_fields
            # Update normalised location fields if not already set
            if result.state and not rep.get("state"):
                updates["state"] = result.state
            if result.district and not rep.get("district"):
                updates["district"] = result.district
            if result.extracted_disaster_type and rep.get("disaster_type") in ("general_emergency", None, ""):
                updates["disaster_type"] = result.extracted_disaster_type

        self.repo.update("reports", "report_id", report_id, updates)
        self.create_audit_log(
            user_id=user["user_id"],
            user_email=user["email"],
            action="process_report_extraction",
            entity_type="report",
            entity_id=report_id,
            details=f"AI extraction {'succeeded' if result.is_success else 'failed'}: {result.status_message}"
        )
        return {
            "status": "success" if result.is_success else "partial",
            "report_id": report_id,
            "extraction_status": updates["extraction_status"],
            "extracted_fields": updates.get("extracted_fields"),
            "message": result.status_message
        }

    def get_public_reports(
        self,
        disaster_type: Optional[str] = None,
        state: Optional[str] = None,
        district: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """Return public-safe reports: live submissions only, no synthetic, no private fields."""
        all_reports = self.repo.get_all("reports")
        filtered = []

        SAFE_FIELDS = {
            "report_id", "disaster_type", "raw_location", "state", "district",
            "city", "latitude", "longitude", "reported_at", "received_at",
            "extraction_status", "data_origin", "source", "language",
            "associated_incident_id", "created_at"
        }

        for r in all_reports:
            # Only expose live (non-synthetic) submissions
            if r.get("data_origin") == "synthetic":
                continue
            if disaster_type and disaster_type != "all" and r.get("disaster_type") != disaster_type:
                continue
            if state and state != "all" and (r.get("state") or "").lower() != state.lower():
                continue
            if district and district != "all" and (r.get("district") or "").lower() != district.lower():
                continue
            if search:
                q = search.lower()
                if not (q in r.get("report_id", "").lower()
                        or q in (r.get("raw_location") or "").lower()
                        or q in (r.get("state") or "").lower()
                        or q in (r.get("disaster_type") or "").lower()):
                    continue

            # Strip private / internal fields
            safe_rep = {k: v for k, v in r.items() if k in SAFE_FIELDS}
            filtered.append(safe_rep)

        filtered.sort(key=lambda x: x.get("received_at", ""), reverse=True)
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, -(-total // page_size)),
            "reports": filtered[start:end]
        }

    def get_public_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Return a single public report with safe fields only."""
        rep = self.repo.get_by_id("reports", "report_id", report_id)
        if not rep:
            return None
        if rep.get("data_origin") == "synthetic":
            return None

        SAFE_FIELDS = {
            "report_id", "disaster_type", "raw_location", "state", "district",
            "city", "latitude", "longitude", "reported_at", "received_at",
            "extraction_status", "data_origin", "source", "language",
            "associated_incident_id", "created_at", "extracted_fields"
        }
        safe_rep = {k: v for k, v in rep.items() if k in SAFE_FIELDS}
        # Strip any private sub-fields from extracted_fields
        if "extracted_fields" in safe_rep and safe_rep["extracted_fields"]:
            ef = safe_rep["extracted_fields"]
            safe_ef = {k: v for k, v in ef.items() if k not in ("entities",)}
            safe_rep["extracted_fields"] = safe_ef
        return safe_rep

emergency_service = EmergencyService()
