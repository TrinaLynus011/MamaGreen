import httpx
import logging

logger = logging.getLogger(__name__)

OLLAMA_TAGS_URL = "http://localhost:11434/api/tags"
OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "llama3"

# Cache detected model name so we don't query /api/tags every single request
_detected_model = None

async def detect_ollama_model() -> str:
    global _detected_model
    if _detected_model is not None:
        return _detected_model

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(OLLAMA_TAGS_URL)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("models", [])
                if models:
                    model_names = [m.get("name") for m in models if m.get("name")]
                    # Preferred order of standard models
                    for preferred in ["llama3", "llama3.2", "llama3:latest", "qwen2.5:1.5b", "gemma2", "qwen", "mistral", "phi3"]:
                        for name in model_names:
                            if name.startswith(preferred) or preferred in name:
                                logger.info(f"[Mama AI Coach] Found preferred model: {name}")
                                _detected_model = name
                                return _detected_model
                    # Fallback to whatever model is loaded first
                    first_model = model_names[0]
                    logger.info(f"[Mama AI Coach] Selecting first available model: {first_model}")
                    _detected_model = first_model
                    return _detected_model
    except Exception as e:
        logger.warning(f"[Mama AI Coach] Could not connect to local Ollama on {OLLAMA_TAGS_URL}. Error: {e}")

    # Fallback to default llama3
    _detected_model = DEFAULT_MODEL
    return _detected_model

# Indian-focused Eco & Wellness advice corpus (35+ keywords / topics)
FALLBACK_RESPONSES = {
    ("hello", "hi", "hey", "namaskar"): (
        "Hello! I am **Mama**, your AI Eco Coach. 🌿 I'm here to optimize your lifestyle footprint.\n\n"
        "- **Carbon Impact:** Swap solo rides to reduce emissions.\n"
        "- **Savings Impact:** Save ₹150+ daily by choosing bus/metro.\n"
        "- **Health Impact:** Walking adds steps to boost your EcoHealth score.\n"
        "- **Reduction Recommendation:** Let's plan tomorrow's green commute!"
    ),
    ("tomorrow", "plan", "schedule"): (
        "Here is your proactive **MamaGreen Plan** for tomorrow:\n\n"
        "- **Carbon Impact:** Swapping a cab for public transit reduces carbon emissions by **0.8kg CO₂**.\n"
        "- **Savings Impact:** Save **₹65** by using bus or metro instead of a taxi.\n"
        "- **Health Impact:** Walking to the station adds **1,500+ steps** and burns **60 kcal**.\n"
        "- **Reduction Recommendation:** Ditch solo rides tomorrow. Log a metro or bus ride on your dashboard!"
    ),
    ("reduce", "carbon", "footprint", "emissions"): (
        "To systematically reduce emissions, follow this guidance:\n\n"
        "- **Carbon Impact:** Public transit cuts travel footprint by **80%** compared to driving a solo car.\n"
        "- **Savings Impact:** Swapping cabs for shared transit keeps **₹3,000+ per month** in your pocket.\n"
        "- **Health Impact:** Active transit adds daily steps, boosting cardiovascular fitness.\n"
        "- **Reduction Recommendation:** Walk or cycle for errands under 2km. Use Metro for longer journeys."
    ),
    ("sprout", "evolve", "pet", "level", "xp"): (
        "Sprout is your virtual EcoHealth companion! Evolve Sprout by earning Green XP from walking, cycling, or public transport. "
        "Keep Sprout's energy high by choosing green transit and completing your daily missions! 🍃"
    ),
    ("bmtc", "best", "bus"): (
        "Taking a BMTC (Bengaluru) or BEST (Mumbai) bus is a sustainable superpower! A single bus replaces 40 cars, cutting your travel carbon footprint by up to 80% while saving you ₹40-60 per trip compared to auto-rickshaws or cabs. Plus, walking to the bus stop adds 1,500 steps to your daily goal! 🚌"
    ),
    ("metro", "train", "local"): (
        "Metro rail systems (like in Bengaluru, Delhi, Mumbai) and local suburban trains are the fastest, cleanest ways to travel. They run on electric power, meaning near-zero direct tailpipe emissions. Taking the Metro instead of a cab cuts your commute emissions by 85% and bypasses peak-hour traffic entirely! 🚇"
    ),
    ("auto", "rickshaw", "tuk"): (
        "Auto-rickshaws (especially CNG or electric ones) are highly space-efficient for short-to-medium trips. However, choosing to walk or cycle for journeys under 2km is even better—it saves you the auto fare (₹30-50), burns calories, and gets Sprout excited! 🛺"
    ),
    ("cab", "ola", "uber", "car", "carpool"): (
        "Cabs and solo gasoline cars contribute the highest carbon emissions per passenger (over 180g CO₂ per km). Swapping just two cab rides a week for Metro or carpooling saves over 5kg of CO₂ and keeps ₹300-500 in your pocket! 🚗"
    ),
    ("scooter", "bike", "two-wheeler", "motorcycle"): (
        "Two-wheelers are popular in India, but standard petrol scooters still emit around 60g CO₂/km. If you commute by two-wheeler, consider switching to an Electric Vehicle (EV) scooter, or try cycling for short college/office commutes to boost your EcoHealth Score! 🛵"
    ),
    ("cycle", "bicycle", "pedal"): (
        "Cycling is a triple-win! It has zero emissions, keeps you extremely fit, and costs nothing. Cycling for 5km instead of riding a motorcycle saves 0.3kg CO₂. Your virtual pet Sprout loves when you cycle—it boosts energy by 15%! 🚲"
    ),
    ("walk", "steps", "footprints", "walking"): (
        "Walking is the ultimate green commute. Every 1,000 steps burns roughly 40 kcal and saves about 150g CO₂ compared to standard driving. Try walking to the local market (*kirana*) instead of taking a scooter. It keeps your daily streak alive! 🚶"
    ),
    ("dal", "lentil", "sambar", "roti", "dal-roti"): (
        "Standard Indian meals like *dal-roti* or *sambar-rice* are global sustainability champions! Lentils (pulses) have a carbon footprint that is 10x lower than poultry and 30x lower than beef. Eating plant-based meals daily is the single best dietary action you can take! 🍲"
    ),
    ("rice", "basmati", "biryani"): (
        "While delicious, flooded rice cultivation produces methane emissions. Swapping white rice for climate-resilient Indian millets like *Ragi* or *Jowar* even twice a week helps save water, improves soil health, and lowers dietary carbon! 🌾"
    ),
    ("millet", "ragi", "jowar"): (
        "Millets (*Ragi*, *Jowar*, *Bajra*) are ancient Indian superfoods. They require 70% less water than rice to grow, are highly nutritious, and have a very low carbon footprint. Try incorporating ragi mudde, jowar roti, or millet khichdi into your diet! 🌾"
    ),
    ("paneer", "dairy", "milk", "curd"): (
        "Dairy products like paneer and ghee have a higher carbon footprint than vegetables because of livestock methane emissions. Swapping paneer for tofu or reducing dairy consumption on alternate days helps shrink your environmental impact! 🥛"
    ),
    ("meat", "chicken", "mutton", "fish"): (
        "Meat production, especially red meat (mutton/lamb), requires vast water and land resources, creating high greenhouse gas emissions. Swapping meat for lentils, chickpeas, or beans for just three meals a week cuts your food carbon footprint by 40%! 🍗"
    ),
    ("plastic", "bag", "wrapper"): (
        "Say no to single-use plastics! Carrying your own cloth bag for groceries and a reusable steel bottle saves up to 150 plastic bags and bottles a year, preventing them from clogging waterways and landfills. 🛍️"
    ),
    ("segregate", "compost", "waste"): (
        "Proper waste segregation is key. Separate wet waste (organic food scraps) from dry waste (paper, plastic, metal). Composting wet waste at home or in your apartment complex reduces landfill methane emissions and gives rich nutrients to plants! 🗑️"
    ),
    ("recycle", "kabadiwala", "scrap"): (
        "The traditional Indian *Kabadiwala* system is one of the world's most efficient recycling networks! Clean your dry recyclables (cardboard, newspapers, bottles) and sell them to your local kabadiwala to ensure they get recycled. 📰"
    ),
    ("water", "tanker", "cauvery", "tap"): (
        "Water is a precious resource in Indian cities. Turn off the tap while brushing, take shorter showers (under 5 minutes), and harvest rainwater if possible. Saving water directly reduces the electricity needed to pump and transport it. 💧"
    ),
    ("ac", "air conditioner", "cooler"): (
        "Setting your AC to 24°C instead of 18°C can reduce your household electricity consumption by up to 24%! It saves carbon emissions at coal power plants and lowers your monthly electricity bill significantly. ❄️"
    ),
    ("lights", "led", "fan", "electricity"): (
        "Switching standard bulbs to LEDs uses 80% less energy. Also, make it a habit to switch off ceiling fans and chargers when leaving a room. Every unit of electricity saved prevents about 0.8kg of CO₂ from being emitted by India's grid! 💡"
    ),
    ("solar", "geyser", "heater"): (
        "Rooftop solar water heaters and solar panels are amazing long-term investments in India. They utilize our abundant sunshine to supply clean energy, cutting your household carbon footprint to near zero! ☀️"
    ),
    ("packaging", "amazon", "zomato", "swiggy"): (
        "Online food and e-commerce deliveries generate a lot of packaging waste. Opt-out of plastic cutlery on Zomato/Swiggy, and choose consolidated shipping options on Amazon/Flipkart to reduce cardboard and plastic waste! 📦"
    ),
    ("bengaluru", "bangalore", "indiranagar", "whitefield"): (
        "Bengaluru's pleasant weather makes it ideal for walking and cycling! Instead of sitting in traffic on Outer Ring Road or Indiranagar 100 Feet Road, try taking the Purple/Green line Metro. It's faster and saves a ton of carbon! 🌳"
    ),
    ("mumbai", "bandra", "local train", "monsoon"): (
        "Mumbai commuters can save massive amounts of emissions by utilizing the local trains and the Metro. During monsoons, public transit is the most reliable way to travel while avoiding the carbon-heavy idling of traffic jams! 🌧️"
    ),
    ("delhi", "ncr", "smog", "aqi"): (
        "Delhi NCR frequently faces air quality challenges. Swapping private cars/scooters for the Delhi Metro, e-rickshaws, or electric buses directly reduces localized particulate matter and helps clear the air for everyone! 😷"
    ),
    ("chennai", "mylapore", "humidity"): (
        "Chennai's coastal climate can be humid, but early mornings are perfect for active walks along the beach or short commutes by the suburban train. Stay hydrated and use public transit to keep your carbon footprint cool! 🌊"
    ),
    ("kolkata", "tram", "howrah"): (
        "Kolkata has some of the most unique green transport options in India—from historical electric trams to river ferries across the Hooghly. Choosing these heritage transit modes saves money and reduces carbon! 🚢"
    ),
    ("hyderabad", "charminar"): (
        "Hyderabad's rolling hills are great for building fitness! Try walking for short errands in areas like Gachibowli or Jubilee Hills. Swap a heavy biryani lunch for a lighter millet alternative once in a while to feel energized! 🕌"
    ),
    ("streak", "daily", "mission"): (
        "Your streak represents consistency in active living! Complete at least one daily challenge (like walking 5,000 steps or taking the Metro) to keep your streak burning and earn bonus Green XP! 🔥"
    ),
    ("ecohealth", "score"): (
        "Your EcoHealth Score (0-100) measures how well you balance personal health with planetary wellness. High step counts and low carbon commutes drive this score up. Can you reach the 'Earth Protector' level? 🏆"
    ),
    ("leaderboard", "priya", "rahul"): (
        "Check out the Leaderboard to see how you rank against other environmental champions in India! Rack up Green XP from active commutes to climb ranks and show Priya and Rahul who the ultimate Eco-Hero is! 🥇"
    ),
    ("sapling", "tree", "forest"): (
        "Every time you level up Sprout and complete milestone challenges, you help grow a virtual forest. In the future, MamaGreen will partner with local NGOs to plant real saplings in your name! 🌳"
    )
}

GENERAL_FALLBACK = (
    "Taking the bus or Metro tomorrow instead of a cab could save you ₹55 and reduce 0.9kg CO₂. "
    "To help Sprout evolve and boost your EcoHealth Score today, try logging a short walk to your nearby grocery store! "
    "Remember: *Every step you take makes India greener!* 🌍"
)

async def get_coach_response(prompt: str, user = None) -> str:
    prompt_lower = prompt.lower()
    
    # Try calling local Ollama first with self-healing model detection
    model_name = await detect_ollama_model()
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            system_prompt = (
                "You are Mama, a proactive Indian AI lifestyle coach for the MamaGreen platform. "
                "You help users track their carbon footprints, save money in Rupees (₹), and stay fit. "
                "Give advice on transit (auto, bus, metro, scooter), Indian diet, and Sprout. "
                "Be proactive, supportive, use emojis, and structure with markdown. Keep it under 120 words."
            )
            if user:
                system_prompt += (
                    f" The current user is {user.username}, age {user.age}, located in {user.primary_location}, "
                    f"with a primary commute preference of {user.commute_preference}. Customize your advice "
                    f"specifically referencing their location and commute choice! (e.g. if they live in Coimbatore "
                    f"and commute by Bus, mention Coimbatore buses, routes, fares, and carbon calculations: "
                    f"'Taking the bus to college this week in Coimbatore could save approximately ₹120 and reduce 2.5kg CO₂.')"
                )
            
            chat_payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "stream": False
            }
            response = await client.post(OLLAMA_URL, json=chat_payload)
            if response.status_code == 200:
                result = response.json()
                return result.get("message", {}).get("content", GENERAL_FALLBACK)
    except Exception as e:
        logger.warning(f"Ollama connection failed (model: {model_name}), reverting to Indian keyword scanner. Error: {e}")

    # Heuristic matching across the 35+ keywords in corpus (intercepted for personalization)
    if user:
        loc = user.primary_location or "Bengaluru"
        pref = (user.commute_preference or "Mixed").lower()
        age = user.age or 25
        
        # 1. Hello/Hi matches
        if any(h in prompt_lower for h in ["hello", "hi ", "hey", "namaskar"]):
            return (
                f"Hello {user.username}! I am **Mama**, your personal AI Eco Coach. 🌿\n\n"
                f"I've tailored my coach metrics for you in **{loc}** based on your primary **{pref.capitalize()}** commute. "
                f"Let's work together to hit your green targets today, feed Sprout, and save some carbon!"
            )
            
        # 2. Plan / Tomorrow matches
        if any(p in prompt_lower for p in ["tomorrow", "plan", "schedule", "commute"]):
            if any(pmode in pref for pmode in ["bus", "metro", "train", "mixed"]):
                return (
                    f"Here is your personalized **MamaGreen Commute & Wellness Plan** for tomorrow in **{loc}**:\n\n"
                    f"1. **Morning Commute (Save ₹45, reduce 0.8kg CO₂):** Take the local {pref.capitalize()} instead of booking a private cab.\n"
                    f"2. **Active Step Goal:** Walking to the transit stop will add ~1,500 steps toward your target!\n"
                    f"3. **Meal Swap:** A simple plant-based lunch (*dal-roti*) cuts dietary carbon by 75%.\n\n"
                    f"Taking the bus to college/office this week in {loc} could save approximately ₹120 and reduce 2.5kg CO₂!"
                )
            elif any(pmode in pref for pmode in ["walk", "cycle", "bicycle"]):
                return (
                    f"Here is your personalized active **MamaGreen Commute Plan** for tomorrow in **{loc}**:\n\n"
                    f"1. **Morning Commute (Save ₹120, 0 emissions):** Walk or cycle to your destination. Zero fuel cost, zero tailpipe carbon!\n"
                    f"2. **Fitness Boost:** Burns ~180-250 calories and increases Sprout's energy by 15%!\n"
                    f"3. **Clean Eating:** Fuel your active day with iron-rich *ragi mudde* or whole lentils.\n\n"
                    f"Keep up the amazing active lifestyle, {user.username}!"
                )
            else: # Car / Scooter / Motorcycle
                return (
                    f"Here is your personalized green transition **Plan** for tomorrow in **{loc}**:\n\n"
                    f"1. **Commute Swap Opportunity:** Taking the local bus/Metro instead of driving your car tomorrow could save you approximately ₹120 and reduce 2.5kg CO₂!\n"
                    f"2. **Steps target:** Park 10 minutes away from your destination to log at least 1,500 extra steps.\n"
                    f"3. **Eco Swap:** Leave the keys behind for short errands under 2km. Walk instead!"
                )

    for keys, reply_text in FALLBACK_RESPONSES.items():
        if isinstance(keys, tuple):
            if any(k in prompt_lower for k in keys):
                return reply_text
        elif keys in prompt_lower:
            return reply_text
            
    return GENERAL_FALLBACK
