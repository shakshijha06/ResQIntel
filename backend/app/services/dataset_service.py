import uuid
import csv
import io
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.database import db_repo
from app.services.reconciliation_engine import reconciliation_engine

class DatasetService:
    def __init__(self):
        self.repo = db_repo

    # --- DATASET MANAGEMENT ---
    def get_all_datasets(self) -> List[Dict[str, Any]]:
        return self.repo.get_all("datasets")

    def get_dataset_by_id(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        return self.repo.get_by_id("datasets", "dataset_id", dataset_id)

    def preview_csv_records(self, csv_content: str, max_rows: int = 5) -> Dict[str, Any]:
        """Parse uploaded CSV and return detected columns and preview rows."""
        f = io.StringIO(csv_content)
        reader = csv.DictReader(f)
        columns = reader.fieldnames or []
        rows = []
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
            rows.append(row)
        return {
            "columns": list(columns),
            "preview_rows": rows,
            "estimated_total": len(csv_content.splitlines()) - 1
        }

    def import_dataset(
        self,
        name: str,
        source_description: str,
        records: List[Dict[str, Any]],
        field_mapping: Dict[str, str],
        user: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Import structured records with source provenance into reports collection."""
        dataset_id = f"DS-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        imported_reports = []
        rejected_count = 0

        for r in records:
            # Map fields using user-provided mapping
            text = r.get(field_mapping.get("original_text", "original_text")) or r.get("text") or r.get("description")
            if not text or not str(text).strip():
                rejected_count += 1
                continue

            disaster_type = r.get(field_mapping.get("disaster_type", "disaster_type")) or "general_emergency"
            raw_location = r.get(field_mapping.get("raw_location", "raw_location")) or r.get("location") or "Unspecified"
            state = r.get(field_mapping.get("state", "state"))
            district = r.get(field_mapping.get("district", "district"))
            
            lat = r.get(field_mapping.get("latitude", "latitude"))
            lon = r.get(field_mapping.get("longitude", "longitude"))
            parsed_lat = None
            parsed_lon = None
            try:
                if lat: parsed_lat = float(lat)
                if lon: parsed_lon = float(lon)
            except (ValueError, TypeError):
                pass

            rep_id = f"REP-DS-{uuid.uuid4().hex[:6].upper()}"
            report_doc = {
                "report_id": rep_id,
                "original_text": str(text).strip(),
                "language": r.get(field_mapping.get("language", "language")) or "en",
                "disaster_type": str(disaster_type).lower().replace(" ", "_"),
                "raw_location": str(raw_location),
                "normalized_location": str(raw_location),
                "state": state,
                "district": district,
                "latitude": parsed_lat,
                "longitude": parsed_lon,
                "reported_at": r.get(field_mapping.get("reported_at", "reported_at")) or now_iso,
                "received_at": now_iso,
                "reported_condition": r.get("reported_condition") or "Imported research observation",
                "source": f"Dataset: {name}",
                "data_origin": "imported_dataset",
                "dataset_id": dataset_id,
                "extraction_status": "raw",
                "associated_incident_id": None,
                "created_at": now_iso
            }
            imported_reports.append(report_doc)

        if imported_reports:
            self.repo.insert_many("reports", imported_reports)

        dataset_meta = {
            "dataset_id": dataset_id,
            "name": name,
            "source_description": source_description,
            "imported_count": len(imported_reports),
            "rejected_count": rejected_count,
            "imported_by": user.get("email", "admin"),
            "imported_at": now_iso,
            "status": "ready"
        }
        self.repo.insert("datasets", dataset_meta)

        return {
            "dataset_id": dataset_id,
            "name": name,
            "imported_count": len(imported_reports),
            "rejected_count": rejected_count,
            "status": "success"
        }

    def delete_dataset(self, dataset_id: str, user: Dict[str, Any]) -> bool:
        """Remove a dataset metadata entry and its imported records."""
        # Remove from datasets
        self.repo.delete("datasets", "dataset_id", dataset_id)
        # Remove reports with matching dataset_id
        all_reps = self.repo.get_all("reports")
        retained = [r for r in all_reps if r.get("dataset_id") != dataset_id]
        if len(retained) < len(all_reps):
            # overwrite collection
            if hasattr(self.repo, "_write_data"):
                self.repo._write_data("reports", retained)
        return True

    # --- SYNTHETIC SCENARIOS GENERATOR ---
    def generate_synthetic_scenario(self, scenario_type: str, user: Dict[str, Any]) -> Dict[str, Any]:
        """Generate clearly labeled controlled synthetic test scenarios."""
        now_iso = datetime.now(timezone.utc).isoformat()
        scenario_id = f"SYN-{uuid.uuid4().hex[:6].upper()}"

        scenarios_catalog = {
            "duplicate_pair": {
                "title": "Exact Duplicate Flood Breach Scenario",
                "reports": [
                    {
                        "original_text": "Breach reported along the embankment near Sector 4 Kamalabari. Water level rising fast towards primary school.",
                        "language": "en",
                        "disaster_type": "flood",
                        "raw_location": "Kamalabari Sector 4, Majuli",
                        "state": "Assam", "district": "Majuli",
                        "latitude": 26.9605, "longitude": 94.2188,
                        "reported_at": now_iso,
                        "reported_condition": "Active levee breach"
                    },
                    {
                        "original_text": "Severe levee breach at Kamalabari Sector 4 Majuli. Flood water rushing towards the local school ground.",
                        "language": "en",
                        "disaster_type": "flood",
                        "raw_location": "Kamalabari, Majuli",
                        "state": "Assam", "district": "Majuli",
                        "latitude": 26.9608, "longitude": 94.2190,
                        "reported_at": now_iso,
                        "reported_condition": "Active levee breach"
                    }
                ]
            },
            "update_sequence": {
                "title": "Urban Flood Progressive Update Chain",
                "reports": [
                    {
                        "original_text": "Initial report: Heavy waterlogging observed on Outer Ring Road near EcoSpace. Vehicles moving slowly in left lane.",
                        "language": "en",
                        "disaster_type": "urban_flood",
                        "raw_location": "EcoSpace ORR, Bellandur",
                        "state": "Karnataka", "district": "Bengaluru Urban",
                        "latitude": 12.9260, "longitude": 77.6762,
                        "reported_at": now_iso,
                        "reported_condition": "6 inches water stagnation"
                    },
                    {
                        "original_text": "UPDATE: Water level on ORR has risen to over 2.5 feet following continuous evening cloudburst. Multiple BMTC buses stalled. Traffic completely halted.",
                        "language": "en",
                        "disaster_type": "urban_flood",
                        "raw_location": "EcoSpace ORR, Bellandur",
                        "state": "Karnataka", "district": "Bengaluru Urban",
                        "latitude": 12.9262, "longitude": 77.6764,
                        "reported_at": now_iso,
                        "reported_condition": "2.5ft deep stagnation, impassable"
                    }
                ]
            },
            "conflict_pair": {
                "title": "Contradictory Road Passability Reports",
                "reports": [
                    {
                        "original_text": "Bridge approach road at Digha Bypass is completely washed away and impassable. No four-wheelers can cross.",
                        "language": "en",
                        "disaster_type": "cyclone",
                        "raw_location": "Digha Coastal Bypass Bridge",
                        "state": "West Bengal", "district": "Purba Medinipur",
                        "latitude": 21.6280, "longitude": 87.5120,
                        "reported_at": now_iso,
                        "reported_condition": "Impassable, washed out"
                    },
                    {
                        "original_text": "Coastal bypass bridge in Digha is structurally intact and cleared for light vehicular traffic. Police detour alert is false.",
                        "language": "en",
                        "disaster_type": "cyclone",
                        "raw_location": "Digha Coastal Bypass Bridge",
                        "state": "West Bengal", "district": "Purba Medinipur",
                        "latitude": 21.6282, "longitude": 87.5122,
                        "reported_at": now_iso,
                        "reported_condition": "Open for traffic, intact"
                    }
                ]
            },
            "multilingual_trio": {
                "title": "Multilingual Landslide Cluster (EN, HI, BN)",
                "reports": [
                    {
                        "original_text": "Massive landslide on NH-108 near Dharasu bend. Debris blocks both lanes, several tourist vehicles stranded.",
                        "language": "en",
                        "disaster_type": "landslide",
                        "raw_location": "Dharasu Bend, NH-108",
                        "state": "Uttarakhand", "district": "Uttarkashi",
                        "latitude": 30.6385, "longitude": 78.3180,
                        "reported_at": now_iso,
                        "reported_condition": "Highway blocked"
                    },
                    {
                        "original_text": "धरासू बेंड के पास भारी भूस्खलन। मलबा आने से राष्ट्रीय राजमार्ग पूरी तरह बंद है। दर्जनों गाड़ियाँ फंसी हैं।",
                        "language": "hi",
                        "disaster_type": "landslide",
                        "raw_location": "धरासू मोड़, उत्तरकाशी",
                        "state": "Uttarakhand", "district": "Uttarkashi",
                        "latitude": 30.6387, "longitude": 78.3182,
                        "reported_at": now_iso,
                        "reported_condition": "मार्ग अवरुद्ध"
                    },
                    {
                        "original_text": "ধারাসু বাঁকের কাছে বড় ধরণের ভূমিধস। জাতীয় সড়ক পুরোপুরি অবরুদ্ধ, বহু গাড়ি আটকে রয়েছে।",
                        "language": "bn",
                        "disaster_type": "landslide",
                        "raw_location": "ধারাসু, উত্তরকাশী",
                        "state": "Uttarakhand", "district": "Uttarkashi",
                        "latitude": 30.6386, "longitude": 78.3181,
                        "reported_at": now_iso,
                        "reported_condition": "জাতীয় সড়ক অবরুদ্ধ"
                    }
                ]
            }
        }

        selected = scenarios_catalog.get(scenario_type, scenarios_catalog["duplicate_pair"])
        generated_reports = []

        for item in selected["reports"]:
            rep_id = f"REP-SYN-{uuid.uuid4().hex[:6].upper()}"
            doc = {
                "report_id": rep_id,
                "original_text": item["original_text"],
                "language": item["language"],
                "disaster_type": item["disaster_type"],
                "raw_location": item["raw_location"],
                "normalized_location": item["raw_location"],
                "state": item["state"],
                "district": item["district"],
                "latitude": item["latitude"],
                "longitude": item["longitude"],
                "reported_at": item["reported_at"],
                "received_at": now_iso,
                "reported_condition": item["reported_condition"],
                "source": "Synthetic Benchmark Scenario",
                "data_origin": "synthetic",
                "synthetic_scenario_id": scenario_id,
                "synthetic_scenario_type": scenario_type,
                "extraction_status": "raw",
                "associated_incident_id": None,
                "created_at": now_iso
            }
            generated_reports.append(doc)

        self.repo.insert_many("reports", generated_reports)

        # Run automated reconciliation on generated pair if 2 reports
        if len(generated_reports) >= 2:
            analysis = reconciliation_engine.analyze_pair(generated_reports[0], generated_reports[1])
            review_id = f"REV-SYN-{uuid.uuid4().hex[:6].upper()}"
            review_record = {
                "review_id": review_id,
                "report_ids": [generated_reports[0]["report_id"], generated_reports[1]["report_id"]],
                "suggested_decision": analysis["suggested_decision"],
                "comparison_classification": analysis["comparison_classification"],
                "reasons": analysis["reasons"],
                "location_comparison": analysis["location_comparison"],
                "timestamp_comparison": analysis["timestamp_comparison"],
                "disaster_type_comparison": analysis["disaster_type_comparison"],
                "status": "pending",
                "data_origin": "synthetic",
                "synthetic_scenario_id": scenario_id,
                "reviewer_decision": None,
                "reviewer_notes": None,
                "reviewed_at": None,
                "reviewed_by": None,
                "created_at": now_iso
            }
            self.repo.insert("reviews", review_record)

        return {
            "scenario_id": scenario_id,
            "scenario_title": selected["title"],
            "scenario_type": scenario_type,
            "reports_generated": len(generated_reports),
            "created_at": now_iso
        }

    def reset_synthetic_data(self) -> Dict[str, Any]:
        """Delete all synthetic records across reports, reviews, and test data."""
        # Reports
        reports = self.repo.get_all("reports")
        real_reports = [r for r in reports if r.get("data_origin") != "synthetic"]
        deleted_reports = len(reports) - len(real_reports)
        if hasattr(self.repo, "_write_data"):
            self.repo._write_data("reports", real_reports)

        # Reviews
        reviews = self.repo.get_all("reviews")
        real_reviews = [rv for rv in reviews if rv.get("data_origin") != "synthetic"]
        deleted_reviews = len(reviews) - len(real_reviews)
        if hasattr(self.repo, "_write_data"):
            self.repo._write_data("reviews", real_reviews)

        return {
            "status": "success",
            "deleted_synthetic_reports": deleted_reports,
            "deleted_synthetic_reviews": deleted_reviews,
            "message": "All synthetic benchmark records have been cleanly purged. Live operational submissions remain intact."
        }

dataset_service = DatasetService()
