import json
import os
import re
import threading
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.config import settings

def _sanitize_error_message(err: Exception) -> str:
    """Strip any MongoDB URIs, credentials or connection strings from error messages."""
    msg = str(err)
    # Remove standard mongo uri patterns: mongodb://user:pass@host or mongodb+srv://...
    msg = re.sub(r'mongodb(?:\+srv)?://[^\s@]+@[^\s/]+', 'mongodb://[REDACTED_AUTH]@[REDACTED_HOST]', msg)
    msg = re.sub(r'mongodb(?:\+srv)?://[^\s]+', 'mongodb://[REDACTED_URI]', msg)
    return msg

class BaseRepository(ABC):
    @abstractmethod
    def get_all(self, collection_name: str) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    def get_by_id(self, collection_name: str, id_field: str, item_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def find_one(self, collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def find(self, collection_name: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    def insert(self, collection_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
        pass
        
    @abstractmethod
    def insert_many(self, collection_name: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    def update(self, collection_name: str, id_field: str, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    def delete(self, collection_name: str, id_field: str, item_id: str) -> bool:
        pass

    @abstractmethod
    def delete_many(self, collection_name: str, query: Dict[str, Any]) -> int:
        pass

    @abstractmethod
    def count(self, collection_name: str, query: Optional[Dict[str, Any]] = None) -> int:
        pass

    @abstractmethod
    def is_healthy(self) -> Dict[str, Any]:
        pass


class JsonFileRepository(BaseRepository):
    """
    Thread-safe, robust local persistent JSON repository.
    Used explicitly when STORAGE_BACKEND=json.
    """
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.lock = threading.Lock()
        os.makedirs(self.data_dir, exist_ok=True)
        
    def _get_file_path(self, collection_name: str) -> str:
        return os.path.join(self.data_dir, f"{collection_name}.json")

    def _read_data(self, collection_name: str) -> List[Dict[str, Any]]:
        file_path = self._get_file_path(collection_name)
        if not os.path.exists(file_path):
            return []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _write_data(self, collection_name: str, data: List[Dict[str, Any]]):
        file_path = self._get_file_path(collection_name)
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def get_all(self, collection_name: str) -> List[Dict[str, Any]]:
        with self.lock:
            return self._read_data(collection_name)

    def get_by_id(self, collection_name: str, id_field: str, item_id: str) -> Optional[Dict[str, Any]]:
        with self.lock:
            items = self._read_data(collection_name)
            for item in items:
                if str(item.get(id_field)) == str(item_id):
                    return item
            return None

    def find_one(self, collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.lock:
            items = self._read_data(collection_name)
            for item in items:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    return item
            return None

    def find(self, collection_name: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        with self.lock:
            items = self._read_data(collection_name)
            results = []
            for item in items:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(item)
            return results

    def insert(self, collection_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
        with self.lock:
            items = self._read_data(collection_name)
            items.append(item)
            self._write_data(collection_name, items)
            return item

    def insert_many(self, collection_name: str, new_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        with self.lock:
            items = self._read_data(collection_name)
            items.extend(new_items)
            self._write_data(collection_name, items)
            return new_items

    def update(self, collection_name: str, id_field: str, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        with self.lock:
            items = self._read_data(collection_name)
            for i, item in enumerate(items):
                if str(item.get(id_field)) == str(item_id):
                    items[i].update(updates)
                    self._write_data(collection_name, items)
                    return items[i]
            return None

    def delete(self, collection_name: str, id_field: str, item_id: str) -> bool:
        with self.lock:
            items = self._read_data(collection_name)
            orig_len = len(items)
            items = [item for item in items if str(item.get(id_field)) != str(item_id)]
            if len(items) < orig_len:
                self._write_data(collection_name, items)
                return True
            return False

    def delete_many(self, collection_name: str, query: Dict[str, Any]) -> int:
        with self.lock:
            items = self._read_data(collection_name)
            orig_len = len(items)
            kept = []
            for item in items:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if not match:
                    kept.append(item)
            deleted_count = orig_len - len(kept)
            if deleted_count > 0:
                self._write_data(collection_name, kept)
            return deleted_count

    def count(self, collection_name: str, query: Optional[Dict[str, Any]] = None) -> int:
        with self.lock:
            items = self._read_data(collection_name)
            if not query:
                return len(items)
            cnt = 0
            for item in items:
                match = True
                for k, v in query.items():
                    if item.get(k) != v:
                        match = False
                        break
                if match:
                    cnt += 1
            return cnt

    def is_healthy(self) -> Dict[str, Any]:
        return {
            "status": "healthy",
            "backend": "json",
            "data_dir": self.data_dir,
            "connected": True
        }


class MongoRepository(BaseRepository):
    """
    Production-grade MongoDB Atlas implementation using PyMongo.
    Enforces connection verification on startup and manages collection indexes.
    """
    def __init__(self, uri: str, db_name: str):
        from pymongo import MongoClient
        self.client = MongoClient(uri, serverSelectionTimeoutMS=8000)
        self.db = self.client[db_name]
        # Verify connection immediately upon instantiation
        self.client.admin.command('ping')
        # Ensure collection indexes
        self.ensure_indexes()

    def ensure_indexes(self):
        """
        Creates unique indexes for stable record IDs across all collections
        and performance indexes for frequent query paths.
        Safe to run repeatedly (idempotent in MongoDB).
        """
        id_index_specs = {
            "activity_logs": "activity_id",
            "audit_logs": "log_id",
            "incidents": "incident_id",
            "notifications": "notification_id",
            "reports": "report_id",
            "reviews": "review_id",
            "submission_tracking": "reference_id",
            "users": "user_id",
        }
        for coll_name, id_field in id_index_specs.items():
            try:
                self.db[coll_name].create_index([(id_field, 1)], unique=True, background=True)
            except Exception as e:
                print(f"[MongoRepository] Index creation notice on {coll_name}.{id_field}: {_sanitize_error_message(e)}")

        # Unique index on users.email
        try:
            self.db["users"].create_index([("email", 1)], unique=True, background=True)
        except Exception as e:
            print(f"[MongoRepository] Index creation notice on users.email: {_sanitize_error_message(e)}")

        # Performance query indexes
        try:
            self.db["reports"].create_index([("associated_incident_id", 1)], background=True)
            self.db["reports"].create_index([("disaster_type", 1)], background=True)
            self.db["reports"].create_index([("data_origin", 1)], background=True)
            self.db["reports"].create_index([("created_at", -1)], background=True)

            self.db["incidents"].create_index([("current_status", 1)], background=True)
            self.db["incidents"].create_index([("disaster_type", 1)], background=True)
            self.db["incidents"].create_index([("updated_at", -1)], background=True)

            self.db["reviews"].create_index([("status", 1)], background=True)
            self.db["reviews"].create_index([("created_at", -1)], background=True)

            self.db["notifications"].create_index([("is_read", 1)], background=True)
            self.db["notifications"].create_index([("created_at", -1)], background=True)

            self.db["audit_logs"].create_index([("timestamp", -1)], background=True)
            self.db["submission_tracking"].create_index([("token_hash", 1)], background=True)
        except Exception as e:
            print(f"[MongoRepository] Query index creation notice: {_sanitize_error_message(e)}")

    def close(self):
        """Close the PyMongo client connection."""
        try:
            self.client.close()
        except Exception:
            pass

    def get_all(self, collection_name: str) -> List[Dict[str, Any]]:
        docs = list(self.db[collection_name].find())
        for d in docs:
            d.pop('_id', None)
        return docs

    def get_by_id(self, collection_name: str, id_field: str, item_id: str) -> Optional[Dict[str, Any]]:
        doc = self.db[collection_name].find_one({id_field: item_id})
        if doc:
            doc.pop('_id', None)
        return doc

    def find_one(self, collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc = self.db[collection_name].find_one(query)
        if doc:
            doc.pop('_id', None)
        return doc

    def find(self, collection_name: str, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        docs = list(self.db[collection_name].find(query))
        for d in docs:
            d.pop('_id', None)
        return docs

    def insert(self, collection_name: str, item: Dict[str, Any]) -> Dict[str, Any]:
        item_copy = item.copy()
        self.db[collection_name].insert_one(item_copy)
        item_copy.pop('_id', None)
        return item_copy

    def insert_many(self, collection_name: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        items_copy = [i.copy() for i in items]
        if items_copy:
            self.db[collection_name].insert_many(items_copy)
            for i in items_copy:
                i.pop('_id', None)
        return items_copy

    def update(self, collection_name: str, id_field: str, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        self.db[collection_name].update_one({id_field: item_id}, {"$set": updates})
        return self.get_by_id(collection_name, id_field, item_id)

    def delete(self, collection_name: str, id_field: str, item_id: str) -> bool:
        res = self.db[collection_name].delete_one({id_field: item_id})
        return res.deleted_count > 0

    def delete_many(self, collection_name: str, query: Dict[str, Any]) -> int:
        res = self.db[collection_name].delete_many(query)
        return res.deleted_count

    def count(self, collection_name: str, query: Optional[Dict[str, Any]] = None) -> int:
        q = query or {}
        return self.db[collection_name].count_documents(q)

    def is_healthy(self) -> Dict[str, Any]:
        try:
            self.client.admin.command('ping')
            return {
                "status": "healthy",
                "backend": "mongodb",
                "database": self.db.name,
                "connected": True
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": "mongodb",
                "error": _sanitize_error_message(e),
                "connected": False
            }


def get_repository() -> BaseRepository:
    backend_mode = (settings.STORAGE_BACKEND or "").strip().lower()

    if backend_mode == "mongodb":
        if not settings.MONGODB_URI or not settings.MONGODB_URI.strip():
            raise RuntimeError(
                "CRITICAL STARTUP ERROR: STORAGE_BACKEND is set to 'mongodb', but MONGODB_URI is not configured. "
                "Silent fallback to JSON is disabled. Please configure MONGODB_URI in your environment or backend/.env file."
            )

        try:
            repo = MongoRepository(settings.MONGODB_URI, settings.MONGODB_DB_NAME)
            return repo
        except Exception as e:
            sanitized = _sanitize_error_message(e)
            raise RuntimeError(
                f"CRITICAL STARTUP ERROR: STORAGE_BACKEND is set to 'mongodb', but failed to connect to "
                f"MongoDB Atlas database '{settings.MONGODB_DB_NAME}'. Silent fallback to JSON is disabled. "
                f"Connection failure details: {sanitized}"
            ) from None

    elif backend_mode == "json":
        return JsonFileRepository(settings.get_resolved_data_dir())

    else:
        raise ValueError(
            f"CRITICAL CONFIGURATION ERROR: Invalid STORAGE_BACKEND '{settings.STORAGE_BACKEND}'. "
            f"Supported values are 'mongodb' or 'json'. Startup halted."
        )

db_repo = get_repository()
