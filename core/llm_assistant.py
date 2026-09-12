import os
import json
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env file if present
load_dotenv()

class LLMAssistant:
    """
    Handles Gemini LLM interaction for bi-temporal geospatial change analysis,
    generating executive summaries, change explanations, table of contents, and AI chat.
    """

    def __init__(self, default_api_key: str = None):
        self.default_api_key = default_api_key or os.getenv("GEMINI_API_KEY")

    def _get_client(self, api_key: str = None):
        key = api_key or self.default_api_key or os.getenv("GEMINI_API_KEY")
        if not key or key.strip() == "" or key.strip() == "your_gemini_api_key_here":
            return None
        return genai.Client(api_key=key.strip())

    def generate_synthesis(self, gis_data: dict, metadata: dict, api_key: str = None) -> dict:
        """
        Generates structured executive summary, change explanation, TOC, and recommendations.
        """
        client = self._get_client(api_key)
        metrics = gis_data.get('summary_metrics', {})
        polygons = gis_data.get('polygons', [])[:5]  # Top 5 polygons

        poly_str = "\n".join([
            f"  - Polygon #{p['rank']}: Area {p['area_m2']} m² ({p['area_ha']} ha), Centroid: ({p['centroid_lat']}, {p['centroid_lon']}), Severity: {p['severity']}"
            for p in polygons
        ])

        prompt = f"""You are an expert Remote Sensing Scientist and GIS Analyst.
Analyze the following bi-temporal satellite change detection statistics and generate a comprehensive executive analysis report.

### DATASET & METADATA:
- T1 Acquisition Date: {metadata.get('t1_date', 'Prior Timestamp')}
- T2 Acquisition Date: {metadata.get('t2_date', 'Recent Timestamp')}
- Time Difference: {metadata.get('time_diff', 'Bi-temporal Pair')}
- Center Coordinates: Latitude {metrics.get('center_lat')}, Longitude {metrics.get('center_lon')}
- Pixel Resolution: {metrics.get('pixel_resolution_m')} m/pixel
- Total Covered Area: {metrics.get('total_area_m2')} m² ({metrics.get('total_area_ha')} ha)
- Total Changed Area: {metrics.get('changed_area_m2')} m² ({metrics.get('changed_area_ha')} ha)
- Percentage Affected: {metrics.get('changed_percentage')}%
- Total Affected Clusters: {metrics.get('polygon_count')} distinct polygon clusters

### TOP AFFECTED CHANGE CLUSTERS:
{poly_str if poly_str else "No major polygon clusters identified."}

Provide your response as a valid JSON object with the following keys:
1. "table_of_contents": Array of strings representing the document sections.
2. "executive_summary": High-level executive overview (2-3 paragraphs).
3. "change_explanation": Detailed explanation of probable physical drivers (urban construction, deforestation, agricultural land clearing, water body movement, or disaster impact).
4. "environmental_impact": Risk and environmental impact assessment.
5. "recommended_actions": List of 3-5 actionable recommendations for spatial planners or field survey teams.
"""

        if not client:
            return self._generate_fallback_synthesis(metrics, polygons, metadata)

        candidate_models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-1.5-flash']
        for model_name in candidate_models:
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json"
                        )
                    )
                    data = json.loads(response.text)
                    return data
                except Exception as e:
                    print(f"Gemini API model {model_name} attempt {attempt+1} error: {e}")
                    if "503" in str(e):
                        time.sleep(1)

        print("All Gemini API models failed. Falling back to template synthesis.")
        return self._generate_fallback_synthesis(metrics, polygons, metadata)

    def chat(self, user_message: str, chat_history: list, gis_data: dict = None, metadata: dict = None, api_key: str = None) -> str:
        """
        Interactive chat endpoint allowing user to ask questions about the change analysis.
        Differentiates between general greetings when no analysis has been run yet vs active analysis queries.
        """
        client = self._get_client(api_key)

        has_active_analysis = gis_data is not None and bool(gis_data.get('summary_metrics'))

        if has_active_analysis:
            metrics = gis_data.get('summary_metrics', {})
            polygons = gis_data.get('polygons', [])[:5]
            system_instruction = f"""You are an AI Remote Sensing Assistant for satellite image analysis.
Current Context (Active Analysis):
- Location: Lat {metrics.get('center_lat')}, Lon {metrics.get('center_lon')}
- Total Area: {metrics.get('total_area_ha')} ha ({metrics.get('total_area_m2')} m²)
- Changed/Identified Area: {metrics.get('changed_area_ha', 0)} ha
- T1 Date: {metadata.get('t1_date', 'N/A') if metadata else 'N/A'}, T2 Date: {metadata.get('t2_date', 'N/A') if metadata else 'N/A'}

If the user greets you or asks general questions (e.g. 'hi', 'hello', 'ok'), acknowledge politely and offer to answer questions about the current analysis results.
If the user asks specific questions, answer clearly and accurately based on the spatial metrics above.
Do NOT invent fake metrics or coordinates not supported by the data above."""
        else:
            system_instruction = """You are GeoChange AI, an AI Remote Sensing Assistant for bi-temporal satellite change detection and CLOSP-VS Sentinel-1 SAR / Sentinel-2 Optical vision-language analysis.
No satellite image or pair has been uploaded or analyzed yet in this session.
If the user greets you (e.g., 'hi', 'hello', 'ok', 'hey'), respond politely and explain:
'Hello! I am ready to assist you. To begin satellite image analysis, please attach your image file(s) using the attachment buttons below, or ask me any geospatial question!'
CRITICAL RULE: Do NOT invent, hallucinate, or display any fake coordinates, land cover percentages (e.g., 49.56% forest), or similarity scores when no image has been uploaded or analyzed."""

        if not client:
            # Fallback response when Gemini API key is not configured
            msg_lower = user_message.lower().strip()
            if msg_lower in ['hi', 'hello', 'hey', 'hi!', 'hello!', 'ok']:
                if has_active_analysis:
                    metrics = gis_data.get('summary_metrics', {})
                    return (
                        f"Hello! I am your AI Remote Sensing Assistant. "
                        f"Your active analysis covers **{metrics.get('total_area_ha', 'N/A')} hectares** at coordinates "
                        f"({metrics.get('center_lat', 'N/A')}, {metrics.get('center_lon', 'N/A')}). "
                        f"How can I help you interpret these findings?"
                    )
                else:
                    return (
                        "Hello! I am GeoChange AI, your Remote Sensing Assistant. "
                        "To perform satellite image analysis (Sentinel-1 SAR, Sentinel-2 Optical, or Bi-Temporal Change Detection), "
                        "please attach your image file(s) using the **+** or attachment buttons below, or ask me any geospatial question!"
                    )
            elif has_active_analysis:
                metrics = gis_data.get('summary_metrics', {})
                return (
                    f"Based on your active raster analysis ({metrics.get('total_area_ha', 0)} ha covered area at Lat {metrics.get('center_lat')}, Lon {metrics.get('center_lon')}), "
                    f"I am ready to assist with detailed spatial interpretation."
                )
            else:
                return (
                    "To begin analysis, please upload your satellite image file(s) using the attachment controls below, or ask any geospatial question."
                )

        candidate_models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-1.5-flash']
        for model_name in candidate_models:
            try:
                contents = []
                for msg in chat_history:
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.get("content", ""))]))

                contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction
                    )
                )
                return response.text
            except Exception as e:
                print(f"Gemini Chat model {model_name} error: {e}")

        return "Hello! Please attach your satellite image file(s) to perform analysis, or ask any geospatial question."

    def _generate_fallback_synthesis(self, metrics: dict, polygons: list, metadata: dict) -> dict:
        c_percent = metrics.get('changed_percentage', 0.0)
        c_area_ha = metrics.get('changed_area_ha', 0.0)
        p_count = metrics.get('polygon_count', 0)

        return {
            "table_of_contents": [
                "1. Document Overview & Metadata",
                "2. Executive Summary",
                "3. Spatial Change Metrics & Top Affected Clusters",
                "4. Bi-Temporal Change Explanation & Driver Analysis",
                "5. Risk & Environmental Impact Assessment",
                "6. Actionable Field Recommendations"
            ],
            "executive_summary": (
                f"Bi-temporal satellite change analysis between {metadata.get('t1_date', 'T1')} and {metadata.get('t2_date', 'T2')} "
                f"revealed a total affected area of {c_area_ha:.4f} hectares ({c_percent:.2f}% of the total monitored area). "
                f"A total of {p_count} distinct spatial change clusters were identified using TinyCD neural network inference and GeoPandas polygon vectorization."
            ),
            "change_explanation": (
                f"The observed change pattern concentrated across {p_count} spatial clusters indicates significant surface transformation. "
                f"Key drivers typically include new infrastructure development, land clearing, vegetation clearing, or hydrological shifts. "
                f"The highest density cluster covers {polygons[0]['area_m2'] if polygons else 0} m² at centroid ({polygons[0]['centroid_lat'] if polygons else 0}, {polygons[0]['centroid_lon'] if polygons else 0})."
            ),
            "environmental_impact": (
                f"With {c_percent:.2f}% of total surface area impacted, environmental monitoring is recommended. "
                f"Localized soil erosion, loss of canopy coverage, or impermeable surface increase could alter micro-drainage patterns."
            ),
            "recommended_actions": [
                "Deploy drone or high-resolution field survey team to verify top 3 change cluster centroids.",
                "Cross-reference changed polygon coordinates with local municipal zoning permits.",
                "Monitor hydrological runoff in areas surrounding major land transformations.",
                "Establish baseline satellite tracking interval of 30 days for ongoing monitoring."
            ]
        }

    def generate_closp_synthesis(self, closp_res: dict, geo_metrics: dict, user_query: str = None, api_key: str = None) -> dict:
        """
        Generates structured synthesis report for Sentinel-1 / Sentinel-2 CLOSP-VS zero-shot vision-language analysis.
        """
        client = self._get_client(api_key)
        modality = closp_res.get('modality', 'Optical')
        top_cat = closp_res.get('top_classification', 'Land Cover')
        confidence = closp_res.get('top_confidence_pct', 0.0)
        evidence = closp_res.get('semantic_evidence', [])

        ev_str = "\n".join([
            f"  - Rank #{e['rank']}: {e['category']} (Similarity Score: {e['similarity_score']}%, Confidence: {e['evidence_level']})"
            for e in evidence[:5]
        ])

        prompt = f"""You are a Remote Sensing Specialist analyzing Sentinel-1 SAR and Sentinel-2 Optical imagery using the CLOSP-VS Vision-Language model.
Analyze the following zero-shot semantic identification similarity scores and spatial metadata:

### CLOSP-VS SEMANTIC IDENTIFICATION METRICS:
- Image Modality: {modality} (Sentinel-1 SAR / Sentinel-2 Optical)
- Primary Semantic Classification: {top_cat} (Similarity Score: {confidence}%)
- User Query: {user_query if user_query else 'General Land Cover & Semantic Classification'}
- Center Coordinates: Lat {geo_metrics.get('center_lat')}, Lon {geo_metrics.get('center_lon')}
- Coverage Area: {geo_metrics.get('total_area_m2')} m² ({geo_metrics.get('total_area_ha')} ha)
- Pixel Resolution: {geo_metrics.get('pixel_resolution_m')} m/pixel

### RANKED SEMANTIC SIMILARITY EVIDENCE:
{ev_str}

Provide your response as a valid JSON object with the following keys:
1. "executive_summary": Professional remote sensing summary (2 paragraphs) answering the semantic identification query.
2. "semantic_comparison": Detailed comparison between top identified land cover classes (e.g. forest vs agriculture vs urban).
3. "spatial_area_breakdown": Summary of estimated area allocation based on CLOSP-VS similarity vector scores and spatial rasters.
4. "actionable_insights": List of 3-4 spatial planning recommendations.
"""

        if client:
            candidate_models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-1.5-flash']
            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(response_mime_type="application/json")
                    )
                    return json.loads(response.text)
                except Exception as e:
                    print(f"Gemini CLOSP synthesis error with {model_name}: {e}")

        # Fallback synthesis if Gemini API key not configured or fails
        return {
            "executive_summary": (
                f"CLOSP-VS vision-language analysis on {modality} imagery identified '{top_cat}' as the primary land cover classification "
                f"with a top similarity evidence score of {confidence:.2f}%. Covered area totals {geo_metrics.get('total_area_ha', 0)} hectares "
                f"at coordinates ({geo_metrics.get('center_lat', 0)}, {geo_metrics.get('center_lon', 0)})."
            ),
            "semantic_comparison": (
                f"Semantic vector embeddings indicate strong correspondence with {top_cat}. "
                f"Compared against other candidate land cover classes, {evidence[0]['category'] if evidence else 'Primary Class'} shows the highest feature similarity."
            ),
            "spatial_area_breakdown": (
                f"Total raster area: {geo_metrics.get('total_area_m2', 0)} m² ({geo_metrics.get('total_area_ha', 0)} ha). "
                f"Top semantic class '{top_cat}' accounts for an estimated {(confidence):.1f}% weight of the analyzed scene."
            ),
            "actionable_insights": [
                f"Verify ground-truth land cover status for {top_cat} near centroid ({geo_metrics.get('center_lat', 0)}, {geo_metrics.get('center_lon', 0)}).",
                "Integrate high-resolution multispectral imagery for micro-scale verification.",
                "Cross-reference CLOSP-VS similarity scores with local land use GIS databases."
            ]
        }

