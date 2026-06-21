import httpx
import base64
import logging

logger = logging.getLogger(__name__)

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llava"

# High-fidelity mock analyses based on filename matching for instant demo responsiveness
MOCK_ANALYSES = [
    {
        "keywords": ["salad", "vegan", "vegetable", "fruit", "avocado", "plant", "food"],
        "data": {
            "itemName": "Fresh Plant-Based Salad Bowl",
            "category": "Diet & Nutrition",
            "healthImpact": "Excellent (9.5/10). High in fiber, micronutrients, and hydration. Supports gut health and reduces inflammation.",
            "carbonImpact": "Minimal (0.35 kg CO₂e). Local leafy greens and vegetables have extremely low agricultural and transit emissions.",
            "alternative": "Excellent choice! To optimize further, choose organic, locally sourced produce and buy in bulk to minimize packaging waste."
        }
    },
    {
        "keywords": ["burger", "beef", "meat", "steak", "chicken", "pork", "sausage"],
        "data": {
            "itemName": "Beef Burger & Fries Meal",
            "category": "Diet & Nutrition",
            "healthImpact": "Low-Moderate (3/10). High in saturated fats, sodium, and simple carbs. High intake is linked to elevated cholesterol and heart disease risks.",
            "carbonImpact": "Very High (4.80 kg CO₂e). Cattle farming is the leading agricultural emitter, requiring intensive land use, water, and generating methane.",
            "alternative": "Swap for a Plant-based Beyond/Impossible Burger, which reduces emissions by 89% (~4.2kg CO₂ saved per serving) and has 0mg cholesterol."
        }
    },
    {
        "keywords": ["car", "suv", "gas", "petrol", "sedan"],
        "data": {
            "itemName": "Gasoline Combustion Passenger Vehicle",
            "category": "Mobility & Travel",
            "healthImpact": "Poor (2/10). Promotes sedentary habits. Combustion exhaust releases particulate matter (PM2.5) that harms local air quality and lungs.",
            "carbonImpact": "High (180g CO₂ per kilometer). Direct tailpipe fossil fuel emissions.",
            "alternative": "For commutes under 5km, walk or cycle (burns calories, 0 emissions). For longer trips, use public transit or an Electric Vehicle (EV)."
        }
    },
    {
        "keywords": ["bike", "bicycle", "cycle", "commute"],
        "data": {
            "itemName": "Commuter Hybrid Bicycle",
            "category": "Mobility & Travel",
            "healthImpact": "Outstanding (10/10). High calorie burn (400-600 kcal/hr), strengthens joints, boosts cardiorespiratory health, and releases endorphins.",
            "carbonImpact": "Zero (0.00 kg CO₂e). Fully powered by human energy. No fuel, no emissions.",
            "alternative": "You're already using the most efficient vehicle on the planet! Keep tyres pumped to optimal PSI to reduce rolling resistance."
        }
    },
    {
        "keywords": ["bottle", "plastic", "cup", "disposable", "can"],
        "data": {
            "itemName": "Single-Use Plastic Beverage Bottle",
            "category": "Consumer Goods & Waste",
            "healthImpact": "Moderate (5/10). Safe for single use, but poses risks of microplastic leaching when exposed to sunlight or heat over time.",
            "carbonImpact": "High (0.24 kg CO₂e). Petroleum-based manufacturing, molding, transport, and low global recycling rates.",
            "alternative": "Switch to a Double-Walled Stainless Steel Bottle. It keeps drinks cold, lasts a lifetime, and offsets its production footprint in just 12 refills."
        }
    }
]

DEFAULT_ANALYSIS = {
    "itemName": "Standard Household Item",
    "category": "General Lifestyle",
    "healthImpact": "Good (7/10). Meets standard safety and usability guidelines.",
    "carbonImpact": "Moderate (0.75 kg CO₂e). Average manufacturing, packaging, and distribution carbon footprint.",
    "alternative": "Look for local items with plastic-free, recyclable packaging, or energy-star certifications to reduce overall waste."
}

async def analyze_image_data(filename: str, file_bytes: bytes) -> dict:
    filename_lower = filename.lower()

    # Try calling local LLaVA vision model first
    try:
        base64_image = base64.b64encode(file_bytes).decode('utf-8')
        async with httpx.AsyncClient(timeout=5.0) as client:
            payload = {
                "model": MODEL_NAME,
                "prompt": (
                    "Analyze this image for the MamaGreen platform. Identify what it is, determine its category, "
                    "provide a concise health impact assessment, carbon footprint impact, and recommend a greener alternative. "
                    "Respond ONLY in the following JSON format: "
                    "{\"itemName\": \"...\", \"category\": \"...\", \"healthImpact\": \"...\", \"carbonImpact\": \"...\", \"alternative\": \"...\"}"
                ),
                "images": [base64_image],
                "stream": False,
                "format": "json"
            }
            response = await client.post(OLLAMA_URL, json=payload)
            if response.status_code == 200:
                import json
                result = response.json()
                parsed = json.loads(result.get("response", "{}"))
                if "itemName" in parsed:
                    return parsed
    except Exception as e:
        logger.warning(f"Ollama LLaVA connection failed, reverting to keyword scanner. Error: {e}")

    # Fallback to smart keyword match
    for analysis in MOCK_ANALYSES:
        for keyword in analysis["keywords"]:
            if keyword in filename_lower:
                return analysis["data"]
                
    return DEFAULT_ANALYSIS
