import os
import json
import urllib.request
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.config import settings

class AIExtractionRequest(BaseModel):
    raw_text: str
    language_hint: Optional[str] = None
    source_hint: Optional[str] = None

class AIExtractionResponse(BaseModel):
    is_success: bool
    status_message: str
    extracted_disaster_type: Optional[str] = None
    extracted_disaster_subtype: Optional[str] = None
    extracted_location: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    observation_time: Optional[str] = None
    reported_condition: Optional[str] = None
    severity_indicators: Optional[str] = None
    entities: Optional[list] = None
    ai_provider: str = "Google Gemini"
    raw_response: Optional[Dict[str, Any]] = None

class GeminiAIService:
    """
    Direct Google Gemini REST API integration using official generateContent endpoint.
    Extracts structured emergency parameters without deprecated SDK dependencies.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.is_configured = bool(self.api_key and len(self.api_key.strip()) > 5)

    def extract_report_info(self, request: AIExtractionRequest) -> AIExtractionResponse:
        if not self.is_configured:
            return AIExtractionResponse(
                is_success=False,
                status_message="Gemini API Key not configured.",
                ai_provider="Google Gemini (Dormant)"
            )

        prompt = f"""
You are an expert emergency intelligence extraction system.
Analyze the following emergency report text (which may be in English, Hindi, or Bengali) and extract structured crisis attributes.

REPORT TEXT:
\"\"\"{request.raw_text}\"\"\"

Respond STRICTLY with a valid JSON object with the following fields:
{{
  "disaster_type": "flood | cyclone | landslide | urban_flood | earthquake | wildfire | severe_storm | industrial_hazard | general_emergency",
  "disaster_subtype": string or null,
  "location": string or null (specific named landmark or village),
  "state": string or null (Indian State e.g. Assam, West Bengal, Odisha, Uttarakhand, Karnataka, Maharashtra),
  "district": string or null,
  "city": string or null,
  "observation_time": string or null (e.g. "morning", "14:00", "recent"),
  "reported_condition": string or null (concise condition description),
  "severity_indicators": string or null (e.g. "high", "moderate", "minor injuries", "inundation 2ft"),
  "entities": [list of named organizations, locations, or key nouns]
}}

Do NOT invent details not mentioned in the text. Return pure JSON without markdown backticks.
"""

        endpoint_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        try:
            req_data = json.dumps(payload).encode('utf-8')
            http_req = urllib.request.Request(
                endpoint_url,
                data=req_data,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )

            with urllib.request.urlopen(http_req, timeout=12) as response:
                result = json.loads(response.read().decode('utf-8'))
                raw_text = result['candidates'][0]['content']['parts'][0]['text']
                # Clean up if enclosed in markdown
                raw_text_clean = raw_text.strip()
                if raw_text_clean.startswith("```json"):
                    raw_text_clean = raw_text_clean[7:]
                if raw_text_clean.endswith("```"):
                    raw_text_clean = raw_text_clean[:-3]
                
                parsed = json.loads(raw_text_clean.strip())

                return AIExtractionResponse(
                    is_success=True,
                    status_message="Structured extraction completed successfully via Gemini.",
                    extracted_disaster_type=parsed.get("disaster_type"),
                    extracted_disaster_subtype=parsed.get("disaster_subtype"),
                    extracted_location=parsed.get("location"),
                    state=parsed.get("state"),
                    district=parsed.get("district"),
                    city=parsed.get("city"),
                    observation_time=parsed.get("observation_time"),
                    reported_condition=parsed.get("reported_condition"),
                    severity_indicators=parsed.get("severity_indicators"),
                    entities=parsed.get("entities", []),
                    ai_provider=f"Google Gemini ({self.model_name})",
                    raw_response=parsed
                )
        except Exception as e:
            return AIExtractionResponse(
                is_success=False,
                status_message=f"Gemini extraction encountered an error: {str(e)}",
                ai_provider=f"Google Gemini ({self.model_name})"
            )

    def translate_to_english(self, raw_text: str, source_language: str) -> "TranslationResponse":
        """Translate a non-English emergency report to English using Gemini."""
        if not self.is_configured:
            return TranslationResponse(
                is_success=False,
                status_message="Gemini API Key not configured.",
                ai_provider="Google Gemini (Dormant)"
            )

        lang_name = {"hi": "Hindi", "bn": "Bengali"}.get(source_language, source_language)
        prompt = f"""You are a professional emergency report translator.

Translate the following {lang_name} emergency report dispatch into clear, accurate English.
Preserve all names, locations, numbers, and factual details exactly as stated.
Do NOT summarize, interpret, or add information not present in the original.
Return ONLY the translated English text — no preamble, no explanation.

ORIGINAL {lang_name.upper()} DISPATCH:
\"\"\"{raw_text}\"\"\"

ENGLISH TRANSLATION:"""

        endpoint_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model_name}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1}
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            http_req = urllib.request.Request(
                endpoint_url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(http_req, timeout=12) as response:
                result = json.loads(response.read().decode("utf-8"))
                translated = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                return TranslationResponse(
                    is_success=True,
                    status_message="Translation completed successfully.",
                    original_language=source_language,
                    translated_text=translated,
                    ai_provider=f"Google Gemini ({self.model_name})"
                )
        except Exception as e:
            return TranslationResponse(
                is_success=False,
                status_message=f"Translation error: {str(e)}",
                ai_provider=f"Google Gemini ({self.model_name})"
            )

    def analyze_review_pair(self, report_a: dict, report_b: dict) -> "AIReviewAnalysis":
        """Generate structured AI-assisted comparison between two candidate reports."""
        if not self.is_configured:
            return AIReviewAnalysis(
                is_success=False,
                status_message="Gemini API Key not configured.",
                ai_provider="Google Gemini (Dormant)"
            )

        prompt = f"""You are an expert emergency intelligence analyst comparing two field reports.

Analyze the following two reports and produce a structured JSON comparison for a human reviewer.

REPORT A:
  ID: {report_a.get('report_id', 'Unknown')}
  Language: {report_a.get('language', 'unknown')}
  Disaster Type: {report_a.get('disaster_type', 'unknown')}
  Location: {report_a.get('raw_location', 'unknown')} | State: {report_a.get('state', 'unknown')}
  Reported At: {report_a.get('reported_at', 'unknown')}
  Text: \"\"\"{report_a.get('original_text', '')}\"\"\"

REPORT B:
  ID: {report_b.get('report_id', 'Unknown')}
  Language: {report_b.get('language', 'unknown')}
  Disaster Type: {report_b.get('disaster_type', 'unknown')}
  Location: {report_b.get('raw_location', 'unknown')} | State: {report_b.get('state', 'unknown')}
  Reported At: {report_b.get('reported_at', 'unknown')}
  Text: \"\"\"{report_b.get('original_text', '')}\"\"\"

Respond STRICTLY with a valid JSON object:
{{
  "overall_recommendation": "confirm_match" | "mark_non_match" | "mark_uncertain",
  "confidence_label": "High" | "Moderate" | "Low",
  "text_similarity_label": "High" | "Moderate" | "Low" | "None",
  "disaster_type_match": true | false,
  "location_proximity_label": "Same area" | "Nearby" | "Distant" | "Unknown",
  "temporal_delta_label": "Same event window" | "Near" | "Distant" | "Unknown",
  "supporting_evidence": ["list of 1-3 specific reasons these reports may refer to the same event"],
  "contradictory_evidence": ["list of 1-3 specific differences or contradictions, or empty list"],
  "plain_english_explanation": "A 2-3 sentence plain English summary explaining the comparison finding for a non-expert reviewer.",
  "recommended_reviewer_action": "One sentence instruction for the reviewer on what to do next."
}}

Do NOT invent details not in the texts. Return pure JSON, no markdown backticks."""

        endpoint_url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.model_name}:generateContent?key={self.api_key}"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "response_mime_type": "application/json"}
        }

        try:
            req_data = json.dumps(payload).encode("utf-8")
            http_req = urllib.request.Request(
                endpoint_url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(http_req, timeout=20) as response:
                result = json.loads(response.read().decode("utf-8"))
                raw_text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                if raw_text.startswith("```"):
                    raw_text = raw_text.split("```", 2)[-1].lstrip("json").strip()
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3].strip()
                parsed = json.loads(raw_text)
                return AIReviewAnalysis(
                    is_success=True,
                    status_message="AI analysis completed successfully.",
                    overall_recommendation=parsed.get("overall_recommendation"),
                    confidence_label=parsed.get("confidence_label"),
                    text_similarity_label=parsed.get("text_similarity_label"),
                    disaster_type_match=parsed.get("disaster_type_match"),
                    location_proximity_label=parsed.get("location_proximity_label"),
                    temporal_delta_label=parsed.get("temporal_delta_label"),
                    supporting_evidence=parsed.get("supporting_evidence", []),
                    contradictory_evidence=parsed.get("contradictory_evidence", []),
                    plain_english_explanation=parsed.get("plain_english_explanation"),
                    recommended_reviewer_action=parsed.get("recommended_reviewer_action"),
                    ai_provider=f"Google Gemini ({self.model_name})"
                )
        except Exception as e:
            return AIReviewAnalysis(
                is_success=False,
                status_message=f"AI review analysis error: {str(e)}",
                ai_provider=f"Google Gemini ({self.model_name})"
            )

ai_service = GeminiAIService()


# ---------------------------------------------------------------------------
# RESPONSE SCHEMAS FOR NEW AI OPERATIONS
# ---------------------------------------------------------------------------

class TranslationResponse(BaseModel):
    is_success: bool
    status_message: str
    original_language: Optional[str] = None
    translated_text: Optional[str] = None
    ai_provider: str = "Google Gemini"


class AIReviewAnalysis(BaseModel):
    is_success: bool
    status_message: str
    overall_recommendation: Optional[str] = None      # confirm_match | mark_non_match | mark_uncertain
    confidence_label: Optional[str] = None            # High | Moderate | Low
    text_similarity_label: Optional[str] = None       # High | Moderate | Low | None
    disaster_type_match: Optional[bool] = None
    location_proximity_label: Optional[str] = None    # Same area | Nearby | Distant | Unknown
    temporal_delta_label: Optional[str] = None        # Same event window | Near | Distant | Unknown
    supporting_evidence: Optional[list] = None
    contradictory_evidence: Optional[list] = None
    plain_english_explanation: Optional[str] = None
    recommended_reviewer_action: Optional[str] = None
    ai_provider: str = "Google Gemini"
