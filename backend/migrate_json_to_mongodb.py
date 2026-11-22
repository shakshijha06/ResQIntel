import json
from pathlib import Path
from pymongo import MongoClient

DATA_DIR = Path(__file__).parent / "data"

COLLECTIONS = {
    "activity_logs": ("activity_logs.json", "activity_id"),
    "audit_logs": ("audit_logs.json", "log_id"),
    "incidents": ("incidents.json", "incident_id"),
    "notifications": ("notifications.json", "notification_id"),
    "reports": ("reports.json", "report_id"),
    "reviews": ("reviews.json", "review_id"),
    "submission_tracking": ("submission_tracking.json", "reference_id"),
    "users": ("users.json", "user_id"),
}

from app.config import settings

if not settings.MONGODB_URI:
    raise RuntimeError("MONGODB_URI is missing.")

# Read and validate every source file before writing anything.
prepared = {}

for collection, (filename, id_field) in COLLECTIONS.items():
    path = DATA_DIR / filename

    with path.open("r", encoding="utf-8") as file:
        records = json.load(file)

    if not isinstance(records, list):
        raise ValueError(f"{filename} must contain a JSON array.")

    seen_ids = set()

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise ValueError(f"{filename}: record {index} is not an object.")

        record_id = record.get(id_field)

        if record_id is None or str(record_id).strip() == "":
            raise ValueError(f"{filename}: record {index} has no {id_field}.")

        if str(record_id) in seen_ids:
            raise ValueError(f"{filename}: duplicate {id_field}: {record_id}")

        seen_ids.add(str(record_id))

    prepared[collection] = (id_field, records)

print("All eight JSON files passed validation.")

client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=8000)
db = client[settings.MONGODB_DB_NAME]

try:
    client.admin.command("ping")
    print(f"Connected to database: {db.name}")

    # Do not overwrite records already present in Atlas.
    for collection, (id_field, records) in prepared.items():
        mongo_collection = db[collection]
        inserted = 0

        for record in records:
            result = mongo_collection.update_one(
                {id_field: record[id_field]},
                {"$setOnInsert": record},
                upsert=True
            )
            if result.upserted_id is not None:
                inserted += 1

        print(
            f"{collection}: source={len(records)}, "
            f"newly inserted={inserted}, "
            f"Atlas total={mongo_collection.count_documents({})}"
        )

    print("\nFINAL VERIFICATION")
    all_match = True

    for collection, (id_field, records) in prepared.items():
        actual = db[collection].count_documents({})
        expected = len(records)
        match = actual == expected
        all_match = all_match and match

        print(
            f"{collection}: expected={expected}, "
            f"actual={actual}, match={match}"
        )

    if not all_match:
        print("\nWARNING: Some collection counts do not match.")
    else:
        print("\nSUCCESS: All eight collection counts match the JSON files.")

finally:
    client.close()
