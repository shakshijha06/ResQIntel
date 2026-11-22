import math
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on the Earth in kilometers."""
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def tokenize_text(text: str) -> List[str]:
    """Tokenize multilingual text including Devanagari and Bengali characters."""
    if not text:
        return []
    # Match alphanumeric words across Unicode scripts
    tokens = re.findall(r'\w+', text.lower())
    # Filter very short stopwords (common across languages)
    stopwords = {"the", "is", "at", "which", "on", "in", "and", "a", "an", "to", "of", "for", "with", "by", "from",
                 "है", "में", "की", "के", "और", "से", "पर", "का", "को", "एक", "था",
                 "এবং", "ও", "এ", "তে", "র", "এর", "হচ্ছে", "হয়েছে", "একটি"}
    return [t for t in tokens if len(t) > 1 and t not in stopwords]

def compute_text_similarity(text_a: str, text_b: str) -> float:
    """Compute combined word token and character 3-gram Jaccard similarity."""
    toks_a = set(tokenize_text(text_a))
    toks_b = set(tokenize_text(text_b))
    
    if not toks_a or not toks_b:
        return 0.0

    word_jaccard = len(toks_a.intersection(toks_b)) / max(len(toks_a.union(toks_b)), 1)

    # Character 3-grams for phonetic & morphological inflection across Hindi/Bengali
    def get_char_ngrams(s: str, n=3):
        clean = re.sub(r'\s+', '', s.lower())
        return {clean[i:i+n] for i in range(len(clean) - n + 1)} if len(clean) >= n else set()

    ngrams_a = get_char_ngrams(text_a)
    ngrams_b = get_char_ngrams(text_b)
    ngram_sim = (len(ngrams_a.intersection(ngrams_b)) / max(len(ngrams_a.union(ngrams_b)), 1)) if ngrams_a and ngrams_b else 0.0

    # 60% word tokens, 40% character subwords
    return round(0.6 * word_jaccard + 0.4 * ngram_sim, 3)

def parse_iso_or_default(ts: Optional[str]) -> Optional[datetime]:
    if not ts:
        return None
    try:
        # Handle trailing Z or timezone offsets
        clean_ts = ts.replace("Z", "+00:00")
        return datetime.fromisoformat(clean_ts)
    except Exception:
        return None

def compute_temporal_delta(ts_a: Optional[str], ts_b: Optional[str]) -> Tuple[Optional[float], str]:
    """Returns delta in minutes and a human-readable description."""
    dt_a = parse_iso_or_default(ts_a)
    dt_b = parse_iso_or_default(ts_b)

    if not dt_a or not dt_b:
        return None, "Indeterminate (missing timestamp)"

    diff_seconds = abs((dt_a - dt_b).total_seconds())
    diff_minutes = round(diff_seconds / 60.0, 1)

    if diff_minutes < 60:
        label = f"{int(diff_minutes)} mins"
    elif diff_minutes < 1440:
        hours = round(diff_minutes / 60.0, 1)
        label = f"{hours} hrs"
    else:
        days = round(diff_minutes / 1440.0, 1)
        label = f"{days} days"

    return diff_minutes, label

# Common update development markers
UPDATE_KEYWORDS = [
    "increased", "decreased", "rising", "receding", "entered", "spread", "evacuated",
    "rescued", "cleared", "reopened", "blocked", "worsened", "subsided", "update",
    "now", "later", "further", "barta", "ghat", "paani ghus gaya", "barh gaya", "pani badh",
    "জল বাড়ছে", "জল কমেছে", "উদ্ধার", "অবরুদ্ধ"
]

# Common contradiction/conflict markers
CONTRADICTION_PAIRS = [
    ("dry", "flooded"), ("safe", "danger"), ("open", "blocked"), ("passable", "impassable"),
    ("normal", "submerged"), ("no water", "waterlogging"), ("intact", "collapsed"),
    ("intact", "breach"), ("rumor", "confirmed"), ("reopened", "closed")
]

class ReconciliationEngine:
    """
    Structured, Explainable, Multi-Signal Reconciliation Engine.
    Implements Stages 4 through 12 of the Emergency Intelligence Pipeline.
    """

    def analyze_pair(self, rep_a: Dict[str, Any], rep_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two reports and classify relationship into:
        - exact_duplicate
        - near_duplicate
        - new_update
        - potential_conflict
        - related_report
        - uncertain
        - unrelated
        """
        reasons = []
        contradictions = []

        # 1. Disaster Category Match
        type_a = rep_a.get("disaster_type", "general_emergency")
        type_b = rep_b.get("disaster_type", "general_emergency")
        cat_match = (type_a == type_b)

        if cat_match:
            reasons.append(f"Identical crisis classification: {type_a.replace('_', ' ').title()}")
        else:
            contradictions.append(f"Divergent crisis classifications: {type_a} vs {type_b}")

        # 2. Geographic Matching
        lat_a, lon_a = rep_a.get("latitude"), rep_a.get("longitude")
        lat_b, lon_b = rep_b.get("latitude"), rep_b.get("longitude")
        has_coords = (lat_a is not None and lon_a is not None and lat_b is not None and lon_b is not None)

        dist_km = None
        geo_compatibility = "unknown"

        if has_coords:
            dist_km = haversine_distance_km(float(lat_a), float(lon_a), float(lat_b), float(lon_b))
            if dist_km <= 0.1:
                geo_compatibility = "collocated"
                reasons.append(f"Immediate collocation within {int(dist_km * 1000)} meters")
            elif dist_km <= 1.5:
                geo_compatibility = "nearby"
                reasons.append(f"Nearby vicinity ({dist_km} km distance)")
            elif dist_km <= 10.0:
                geo_compatibility = "same_sector"
                reasons.append(f"Same regional sector ({dist_km} km distance)")
            else:
                geo_compatibility = "distant"
                contradictions.append(f"Geographically separated by {dist_km} km")
        else:
            # Check state/district string matching
            st_a = (rep_a.get("state") or "").lower()
            st_b = (rep_b.get("state") or "").lower()
            distr_a = (rep_a.get("district") or "").lower()
            distr_b = (rep_b.get("district") or "").lower()

            if st_a and st_b and st_a == st_b:
                if distr_a and distr_b and distr_a == distr_b:
                    geo_compatibility = "same_district"
                    reasons.append(f"Same administrative district: {rep_a.get('district')}, {rep_a.get('state')}")
                else:
                    geo_compatibility = "same_state"
                    reasons.append(f"Collocated in same state: {rep_a.get('state')}")
            else:
                contradictions.append("Missing or unverified geographic coordinates")

        # 3. Temporal Matching
        time_a = rep_a.get("reported_at") or rep_a.get("received_at")
        time_b = rep_b.get("reported_at") or rep_b.get("received_at")
        delta_mins, delta_label = compute_temporal_delta(time_a, time_b)

        if delta_mins is not None:
            if delta_mins <= 60:
                reasons.append(f"Close temporal proximity ({delta_label})")
            elif delta_mins <= 720:  # 12 hrs
                reasons.append(f"Within continuous event shift ({delta_label})")
            elif delta_mins <= 2880:  # 48 hrs
                reasons.append(f"Multi-day observation delta ({delta_label})")
            else:
                contradictions.append(f"Substantial time delta ({delta_label}) — likely distinct event cycle")

        # 4. Semantic Similarity
        text_a = rep_a.get("original_text", "")
        text_b = rep_b.get("original_text", "")
        sim_score = compute_text_similarity(text_a, text_b)

        if sim_score >= 0.70:
            reasons.append(f"High semantic similarity ({int(sim_score * 100)}%) across report texts")
        elif sim_score >= 0.40:
            reasons.append(f"Moderate vocabulary overlap ({int(sim_score * 100)}%)")
        else:
            contradictions.append(f"Low semantic similarity ({int(sim_score * 100)}%)")

        # 5. Check for direct contradictions in text
        text_a_lower = text_a.lower()
        text_b_lower = text_b.lower()
        is_direct_conflict = False

        for word_1, word_2 in CONTRADICTION_PAIRS:
            if (word_1 in text_a_lower and word_2 in text_b_lower) or (word_2 in text_a_lower and word_1 in text_b_lower):
                is_direct_conflict = True
                contradictions.append(f"Explicit semantic opposition detected: '{word_1}' vs '{word_2}'")

        # 6. Check for update progression indicators
        has_update_keywords = any(k in text_a_lower or k in text_b_lower for k in UPDATE_KEYWORDS)

        # 7. Classification Decision Tree
        classification = "uncertain"
        suggested_decision = "Requires Review"
        confidence = 0.50

        # Exact Duplicate
        if cat_match and (dist_km is not None and dist_km <= 0.15) and (delta_mins is not None and delta_mins <= 90) and sim_score >= 0.65:
            classification = "exact_duplicate"
            suggested_decision = "Duplicate Report"
            confidence = 0.92

        # Near Duplicate
        elif cat_match and (dist_km is not None and dist_km <= 1.0) and (delta_mins is not None and delta_mins <= 240) and sim_score >= 0.50 and not is_direct_conflict:
            classification = "near_duplicate"
            suggested_decision = "Near Duplicate"
            confidence = 0.82

        # Direct Conflict
        elif is_direct_conflict and cat_match and ((dist_km is not None and dist_km <= 3.0) or geo_compatibility in ("collocated", "nearby", "same_district")):
            classification = "potential_contradiction"
            suggested_decision = "Direct Conflict"
            confidence = 0.85

        # New Update
        elif cat_match and ((dist_km is not None and dist_km <= 3.0) or geo_compatibility in ("collocated", "nearby")) and (delta_mins is not None and 30 <= delta_mins <= 2880) and has_update_keywords:
            classification = "new_update"
            suggested_decision = "Incident Update"
            confidence = 0.78

        # Related Report
        elif cat_match and ((dist_km is not None and dist_km <= 15.0) or geo_compatibility in ("collocated", "nearby", "same_district", "same_sector")):
            classification = "related_report"
            suggested_decision = "Related Incident Report"
            confidence = 0.70

        # Geographically or categorically distinct
        elif (dist_km is not None and dist_km > 30.0) or (not cat_match and (dist_km is not None and dist_km > 10.0)):
            classification = "unrelated"
            suggested_decision = "Unrelated Incident"
            confidence = 0.88

        # Uncertain fallback
        else:
            classification = "uncertain"
            suggested_decision = "Uncertain / Insufficient Information"
            confidence = 0.45

        # Human-readable explanation synthesis
        loc_str = f"at {rep_a.get('raw_location', 'unknown')} and {rep_b.get('raw_location', 'unknown')}"
        if dist_km is not None:
            loc_str = f"approx. {dist_km} km apart"

        plain_explanation = (
            f"Evaluated 2 reports regarding {type_a.replace('_', ' ')} {loc_str}. "
            f"Temporal separation is {delta_label} with {int(sim_score * 100)}% semantic vocabulary alignment. "
            f"Preliminary automated classification points to {suggested_decision.lower()}."
        )

        return {
            "comparison_classification": classification,
            "suggested_decision": suggested_decision,
            "confidence_score": round(confidence, 2),
            "similarity_score": sim_score,
            "reasons": reasons,
            "contradictory_evidence": contradictions,
            "plain_english_explanation": plain_explanation,
            "location_comparison": {
                "report_a": f"{rep_a.get('raw_location', 'Unknown')} ({rep_a.get('latitude')}, {rep_a.get('longitude')})",
                "report_b": f"{rep_b.get('raw_location', 'Unknown')} ({rep_b.get('latitude')}, {rep_b.get('longitude')})",
                "distance_km": dist_km,
                "compatibility": geo_compatibility
            },
            "timestamp_comparison": {
                "time_difference": delta_label,
                "delta_minutes": delta_mins
            },
            "disaster_type_comparison": {
                "match": cat_match,
                "type_a": type_a,
                "type_b": type_b
            }
        }

reconciliation_engine = ReconciliationEngine()
