"""
GreenPath AI — AI Chatbot Service (Google Gemini)
Provides context-aware environmental Q&A with:
  - Gemini API integration (with rule-based fallback)
  - Analysis context injection
  - Conversation history management
"""

import logging
import re
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# ── Fallback rule-based Q&A ───────────────────────────────────────────────────
_FALLBACK_QA = [
    (
        r"(why|what|how).*(aqi|air quality|pollution)",
        "🌫️ **AQI (Air Quality Index)** measures air pollution. "
        "High AQI means more pollutants like PM2.5, NO₂, and CO. In urban areas, "
        "vehicle emissions and industrial activity are major contributors. "
        "Planting more trees helps reduce AQI by absorbing pollutants and releasing oxygen."
    ),
    (
        r"(best|recommend|suggest).*(tree|plant|species)",
        "🌳 **Top recommended trees for urban pollution control:**\n\n"
        "1. **Neem** — Absorbs toxins, fast-growing, drought-resistant\n"
        "2. **Peepal** — 24/7 oxygen producer, excellent CO₂ absorber\n"
        "3. **Banyan** — Massive canopy, superior heat reduction\n"
        "4. **Bamboo** — Fastest CO₂ sequestration, great for boundaries\n\n"
        "Choose based on your zone's AQI, soil, and available space."
    ),
    (
        r"(what is|explain|define).*(ndvi|vegetation index)",
        "🌿 **NDVI (Normalized Difference Vegetation Index)** measures vegetation health. "
        "It ranges from -1 (water/bare land) to +1 (dense forest). "
        "Values above 0.4 indicate healthy, dense vegetation. "
        "Our system approximates NDVI from RGB aerial images using Green and Red channel ratios."
    ),
    (
        r"(carbon|co2|dioxide|sequestration|absorption)",
        "🌱 Trees are nature's carbon capture machines! A single mature tree absorbs "
        "approximately **22 kg of CO₂ per year**. Dense urban forests can sequester "
        "hundreds of tonnes annually. Increasing your green cover by just 10% can "
        "meaningfully reduce your area's carbon footprint."
    ),
    (
        r"(urban heat|heat island|temperature|cooling)",
        "🌡️ **Urban Heat Island Effect** occurs when cities are significantly hotter "
        "than surrounding rural areas due to concrete, asphalt, and reduced vegetation. "
        "Trees cool cities through **evapotranspiration** (releasing water vapour) and "
        "shade. Each tree can reduce local temperature by 0.02–0.05°C. "
        "A green cover above 30% significantly mitigates urban heat."
    ),
    (
        r"(heatmap|density|distribution)",
        "🔥 The **tree density heatmap** shows where trees are concentrated (bright areas) "
        "vs sparse (dark areas). High-density zones reduce heat and pollution locally. "
        "Low-density zones are priority areas for plantation."
    ),
    (
        r"(deforestation|urban expansion|green cover loss|change detection)",
        "⚠️ **Deforestation** and urban expansion are detected by comparing satellite "
        "images over time. Our time-series comparison calculates the change in green "
        "cover percentage and generates a visual diff map showing gained (green) or "
        "lost (red) vegetation areas."
    ),
    (
        r"(how|what).*(predict|forecast|future)",
        "📊 **Predictive Analytics** in GreenPath AI uses polynomial regression models "
        "trained on environmental patterns. We predict future AQI, carbon absorption, "
        "and urban heat trends for up to 24 months based on your current tree count, "
        "green cover, and AQI values. The model achieves R² scores above 0.85 on training data."
    ),
    (
        r"(hello|hi|hey|greet)",
        "👋 Hello! I'm **GreenPath AI Assistant**, your environmental intelligence companion. "
        "I can answer questions about:\n"
        "• 🌿 Tree health and detection\n"
        "• 🌫️ AQI and air quality\n"
        "• 🌡️ Urban heat islands\n"
        "• 🌱 Plantation recommendations\n"
        "• 📊 NDVI and vegetation analysis\n\n"
        "How can I help you today?"
    ),
]

_DEFAULT_RESPONSE = (
    "🤖 I'm your GreenPath AI environmental assistant. I specialise in:\n"
    "• Urban tree analysis and health detection\n"
    "• Air quality (AQI) interpretation\n"
    "• NDVI and vegetation index analysis\n"
    "• Plantation recommendations\n"
    "• Carbon sequestration calculations\n\n"
    "Try asking: *'Why is the AQI high?'* or *'Best trees for pollution control?'*"
)


def _rule_based_response(message: str) -> str:
    """Match message against known patterns and return a response."""
    message_lower = message.lower()
    for pattern, response in _FALLBACK_QA:
        if re.search(pattern, message_lower):
            return response
    return _DEFAULT_RESPONSE


async def get_chatbot_response(
    message: str,
    history: List[Dict[str, str]],
    analysis_context: Optional[Dict[str, Any]],
    gemini_api_key: str = "",
) -> str:
    """
    Generate a chatbot response using Gemini API with rule-based fallback.

    Args:
        message: The user's question.
        history: Previous messages [{"role": "user"/"assistant", "content": "..."}].
        analysis_context: Optional current analysis data to inject as context.
        gemini_api_key: Gemini API key (from settings).

    Returns:
        The assistant's response string (may contain markdown).
    """
    # Build context string if analysis data is available
    context_str = ""
    if analysis_context:
        context_str = (
            f"\n\nCURRENT ANALYSIS CONTEXT:\n"
            f"- Trees Detected: {analysis_context.get('tree_count', 'N/A')}\n"
            f"- Green Cover: {analysis_context.get('green_cover_percent', 'N/A')}%\n"
            f"- AQI Score: {analysis_context.get('aqi_score', 'N/A')} "
            f"({analysis_context.get('aqi_category', 'N/A')})\n"
            f"- NDVI Mean: {analysis_context.get('ndvi_mean', 'N/A')}\n"
            f"- CO₂ Absorption: {analysis_context.get('co2_absorption_kg', 'N/A')} kg/year\n"
            f"- Cooling Level: {analysis_context.get('cooling_level', 'N/A')}\n"
        )

    # ── Try Gemini API ─────────────────────────────────────────────────────
    if gemini_api_key and gemini_api_key.strip():
        try:
            import google.generativeai as genai

            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=(
                    "You are GreenPath AI Assistant, an expert in:\n"
                    "- Urban tree detection using YOLOv8\n"
                    "- Air Quality Index (AQI) analysis\n"
                    "- NDVI and vegetation index\n"
                    "- Urban heat island mitigation\n"
                    "- Carbon sequestration by trees\n"
                    "- Smart plantation recommendations\n"
                    "- Environmental sustainability\n\n"
                    "Respond concisely, use markdown formatting, emoji where helpful. "
                    "If asked about the current analysis, use the provided context data."
                    + context_str
                ),
            )

            # Build conversation history for Gemini
            chat = model.start_chat(history=[
                {"role": m["role"], "parts": [m["content"]]}
                for m in history[-6:]   # last 6 messages for context window
            ])
            response = chat.send_message(message)
            return response.text

        except Exception as e:
            logger.warning(f"Gemini API error: {e}. Falling back to rule-based.")

    # ── Fallback: rule-based response ─────────────────────────────────────
    response = _rule_based_response(message)

    # Inject analysis context into fallback if available
    if analysis_context and "aqi" in message.lower():
        aqi = analysis_context.get("aqi_score", "N/A")
        cat = analysis_context.get("aqi_category", "N/A")
        response = (
            f"📊 **Current Analysis AQI: {aqi} ({cat})**\n\n" + response
        )

    return response
