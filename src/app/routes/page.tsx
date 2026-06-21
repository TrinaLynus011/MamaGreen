"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  MapPin,
  Clock,
  Flame,
  Coins,
  Navigation,
  Star,
  RefreshCw,
  Search,
  Footprints,
  Bike,
  Car,
  AlertTriangle,
  Locate,
  Info,
  Train,
  Bus
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  calculateEmissions,
  calculateCalories,
  calculateCost,
  calculateCarbonSaved,
  calculateMoneySaved,
  estimateDuration
} from "@/utils/calculators";

let maplibregl: any = null;

// Fallback to center of India
const FALLBACK_INDIA: [number, number] = [78.9629, 20.5937]; 

export default function RouteComparison() {
  const [destination, setDestination] = useState("");
  const [currentAddress, setCurrentAddress] = useState("Locating you...");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [destLocation, setDestLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  
  const [routes, setRoutes] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<string>("cycling");
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"pending" | "granted" | "denied">("pending");

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize MapLibre & Geolocation
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      if (!maplibregl) {
        maplibregl = await import("maplibre-gl");
      }

      // Determine starting location priorities:
      // Priority 1: User GPS (handled in geolocation success)
      // Priority 2: Last saved user location
      // Priority 3: Fallback India center
      let initialCenter = FALLBACK_INDIA;
      const lastLoc = localStorage.getItem("mamagreen_last_location");
      if (lastLoc) {
        try {
          initialCenter = JSON.parse(lastLoc);
        } catch (_) {}
      }

      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors"
            }
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 18
            }
          ]
        },
        center: initialCenter,
        zoom: lastLoc ? 14 : 5
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      map.on("load", () => {
        // Add source and layer for routing path lines
        map.addSource("route-source", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: []
          }
        });

        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#2E5E4E",
            "line-width": 5,
            "line-opacity": 0.8
          }
        });

        setMapLoaded(true);
      });

      mapRef.current = map;

      // Start geolocation queries
      requestGeolocation();
    };

    initMap();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Request browser GPS permission & watch location
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setCurrentAddress("Geolocation is not supported by your browser.");
      setGpsStatus("denied");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsStatus("granted");
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords: [number, number] = [lng, lat];
        
        setUserLocation(coords);
        setAccuracy(position.coords.accuracy);
        localStorage.setItem("mamagreen_last_location", JSON.stringify(coords));
        
        reverseGeocode(lng, lat);
        
        if (mapRef.current) {
          mapRef.current.flyTo({ center: coords, zoom: 15 });
          updateUserMarker(coords);
        }
      },
      (error) => {
        console.warn("GPS access denied or error occurred", error);
        setGpsStatus("denied");
        setCurrentAddress("Location permission denied. Showing India fallback.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Watch position in real-time
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords: [number, number] = [lng, lat];
        setUserLocation(coords);
        setAccuracy(position.coords.accuracy);
        updateUserMarker(coords);
      },
      (err) => console.warn("Watch position error", err),
      { enableHighAccuracy: true }
    );
  };

  // Update/render user GPS location marker on map
  const updateUserMarker = (coords: [number, number]) => {
    if (!mapRef.current || !maplibregl) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(coords);
    } else {
      const el = document.createElement("div");
      el.className = "user-gps-marker";
      el.style.backgroundColor = "#4285F4";
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.border = "3px solid #FFFFFF";
      el.style.boxShadow = "0 0 10px rgba(66,133,244,0.6)";

      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(mapRef.current);
    }
  };

  // Reverse geocoding with OpenStreetMap Nominatim
  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentAddress(data.display_name || "Unknown Location Address");
      }
    } catch (err) {
      console.warn("Reverse geocode failed", err);
      setCurrentAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    }
  };

  // Nominatim Search Geocoder & OSRM Routing Engine
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    // Use current GPS, fallback saved, or India fallback as starting source
    let startCoords = userLocation;
    if (!startCoords) {
      const saved = localStorage.getItem("mamagreen_last_location");
      if (saved) startCoords = JSON.parse(saved);
    }
    if (!startCoords) {
      startCoords = FALLBACK_INDIA;
    }

    setLoading(true);
    let targetCoords: [number, number] | null = null;

    // 1. Geocode destination using Nominatim API (Indian emphasis)
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          destination
        )}&countrycodes=in`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          targetCoords = [lng, lat];
          setDestLocation(targetCoords);
        }
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    }

    if (!targetCoords) {
      alert("Could not locate the destination in India. Please check spelling or try another keyword.");
      setLoading(false);
      return;
    }

    // Fly to destination search area
    if (mapRef.current) {
      mapRef.current.flyTo({ center: targetCoords, zoom: 14 });
      
      // Update destination marker
      if (destMarkerRef.current) {
        destMarkerRef.current.setLngLat(targetCoords);
      } else {
        const el = document.createElement("div");
        el.className = "dest-marker";
        el.style.backgroundColor = "#2E5E4E";
        el.style.width = "18px";
        el.style.height = "18px";
        el.style.borderRadius = "50%";
        el.style.border = "3px solid #FAF8F3";
        el.style.boxShadow = "0 0 10px rgba(46,94,78,0.7)";
        
        destMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(targetCoords)
          .addTo(mapRef.current);
      }
    }

    // 2. Query OSRM router for Walking, Cycling, and Driving routes
    const startLng = startCoords[0];
    const startLat = startCoords[1];
    const endLng = targetCoords[0];
    const endLat = targetCoords[1];

    const osrmProfiles = [
      { id: "walking", profile: "foot" },
      { id: "cycling", profile: "bicycle" },
      { id: "driving", profile: "driving" }
    ];

    const routePromises = osrmProfiles.map(async (prof) => {
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/${prof.profile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            return {
              id: prof.id,
              distance: data.routes[0].distance / 1000.0,
              duration: data.routes[0].duration / 60.0,
              geometry: data.routes[0].geometry
            };
          }
        }
      } catch (err) {
        console.warn(`OSRM failed for profile ${prof.id}, trying fallback calculation.`, err);
      }

      // Local heuristic fallback if OSRM service fails
      const directDist = calculateDirectDistance(startLat, startLng, endLat, endLng);
      const speed = prof.id === "walking" ? 5 : prof.id === "cycling" ? 15 : 40; // km/h
      return {
        id: prof.id,
        distance: directDist,
        duration: (directDist / speed) * 60,
        geometry: {
          type: "LineString",
          coordinates: [[startLng, startLat], [endLng, endLat]]
        }
      };
    });

    const osrmResults = await Promise.all(routePromises);
    const walkRes = osrmResults.find(r => r.id === "walking")!;
    const cycleRes = osrmResults.find(r => r.id === "cycling")!;
    const driveRes = osrmResults.find(r => r.id === "driving")!;

    // Map the 3 OSRM geometry/distance profiles to all 8 application transport modes
    const modesList: Array<{ mode: any; source: any; icon: any }> = [
      { mode: "walking", source: walkRes, icon: Footprints },
      { mode: "bicycle", source: cycleRes, icon: Bike },
      { mode: "metro", source: driveRes, icon: Train },
      { mode: "bus", source: driveRes, icon: Bus },
      { mode: "train", source: driveRes, icon: Train },
      { mode: "auto", source: driveRes, icon: Navigation },
      { mode: "scooter", source: driveRes, icon: Bike },
      { mode: "car", source: driveRes, icon: Car }
    ];

    const routeResults = modesList.map((m) => {
      const distance = parseFloat(m.source.distance.toFixed(2));
      const duration = m.mode === "walking" || m.mode === "bicycle"
        ? Math.round(m.source.duration)
        : estimateDuration(m.mode, distance);

      const emissions = calculateEmissions(m.mode, distance);
      const calories = calculateCalories(m.mode, distance);
      const cost = calculateCost(m.mode, distance);
      const co2Saved = calculateCarbonSaved(m.mode, distance);
      const moneySaved = calculateMoneySaved(m.mode, distance);

      return {
        mode: m.mode,
        icon: m.icon,
        distance,
        duration,
        emissions,
        calories,
        cost,
        co2Saved,
        moneySaved,
        geometry: m.source.geometry
      };
    });

    // Tag the lowest carbon mode(s)
    const minEmissions = Math.min(...routeResults.map(r => r.emissions));
    const finalRoutes = routeResults.map(r => ({
      ...r,
      isLowestCarbon: r.emissions === minEmissions && r.mode !== "car"
    }));

    setRoutes(finalRoutes);

    // Calculate best recommendation
    let best = finalRoutes.find(r => r.mode === "bicycle")!;
    let reasonText = "Perfect active commute! 0 emissions, burns calories, and saves vehicle fuel fares.";

    const walkRoute = finalRoutes.find(r => r.mode === "walking");
    const metroRoute = finalRoutes.find(r => r.mode === "metro");
    const busRoute = finalRoutes.find(r => r.mode === "bus");

    if (walkRoute && walkRoute.distance < 2.0) {
      best = walkRoute;
      reasonText = "A beautiful short walk! Zero emissions, maximizes calorie burn, and saves auto/cab money.";
    } else if (metroRoute && metroRoute.distance > 5.0) {
      best = metroRoute;
      reasonText = "Fastest green option — AC Metro is emission-efficient, safe, and avoids city traffic.";
    } else if (busRoute && busRoute.distance > 5.0 && !metroRoute) {
      best = busRoute;
      reasonText = "Excellent low-cost transit. Save emissions and travel efficiently.";
    } else if (best && best.distance <= 5.0) {
      reasonText = "Great health builder! Zero emissions, burns calories, and saves fuel costs.";
    }

    setRecommended({
      ...best,
      reason: reasonText
    });

    // Default draw recommended route on Map
    if (best && best.geometry) {
      drawRouteLine(best.geometry);
      setSelectedMode(best.mode);
    }

    // Fit map view to bounds
    if (mapRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(startCoords);
      bounds.extend(targetCoords);
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }

    setLoading(false);
  };

  // Heuristic straight line distance helper
  const calculateDirectDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1.25; // Multiply by 1.25 to estimate actual street winding
  };

  // Draw GeoJSON line on map
  const drawRouteLine = (geometry: any) => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource("route-source");
    if (source) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: geometry
      });
    }
  };

  // Toggle map route drawing based on clicked card
  const handleSelectRouteMode = (mode: string) => {
    setSelectedMode(mode);
    const selected = routes.find(r => r.mode === mode);
    if (selected && selected.geometry) {
      drawRouteLine(selected.geometry);
    }
  };

  // Locate User GPS trigger
  const handleLocateMe = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: userLocation, zoom: 15 });
    } else {
      requestGeolocation();
    }
  };

  // Recenter both points
  const handleRecenter = () => {
    if (mapRef.current) {
      let startCoords = userLocation;
      if (!startCoords) {
        const saved = localStorage.getItem("mamagreen_last_location");
        if (saved) startCoords = JSON.parse(saved);
      }
      if (!startCoords) startCoords = FALLBACK_INDIA;

      const bounds = new maplibregl.LngLatBounds();
      bounds.extend(startCoords);
      if (destLocation) {
        bounds.extend(destLocation);
      }
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  };

  // Calculate carbon savings relative to car
  const getCarbonSavedValue = (routeObj: any) => {
    const carRoute = routes.find(r => r.mode === "car");
    if (!carRoute || routeObj.mode === "car") return 0;
    return parseFloat((carRoute.emissions - routeObj.emissions).toFixed(2));
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Configuration Panel (Left side) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        
        {/* Geocoder inputs */}
        <div className="glass-card rounded-3xl p-5 shadow-sm border border-brand-sage/20 bg-white/60">
          <span className="text-[10px] uppercase tracking-wider text-brand-forest/60 font-bold block mb-1">
            Indian Route Optimizer
          </span>
          <h2 className="text-lg font-bold font-poppins text-brand-forest mb-4">Plan Carbon-Free Travel</h2>

          {/* Current Address display */}
          <div className="mb-4 bg-brand-forest/5 p-3 rounded-2xl border border-brand-forest/15">
            <span className="block text-[8px] font-extrabold uppercase text-brand-forest tracking-wider mb-0.5">
              📌 Where Am I (Current GPS Address)
            </span>
            <p className="text-xxs font-semibold text-brand-brown/80 leading-normal line-clamp-2">
              {currentAddress}
            </p>
            {accuracy && (
              <span className="text-[8px] font-bold text-brand-forest/60 block mt-1">
                Accuracy: ±{Math.round(accuracy)} meters
              </span>
            )}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-forest/50" />
              <input
                type="text"
                placeholder="Where to? (e.g. Karunya University, Chennai)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-white/70 border border-brand-sage/35 focus:border-brand-forest focus:outline-none rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-brand-brown shadow-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-3 bg-brand-forest hover:bg-brand-forest/90 disabled:bg-brand-forest/70 text-brand-cream font-bold rounded-2xl shadow-sm hover:shadow transition-all text-xs flex items-center justify-center min-w-18.75"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Plan"}
            </button>
          </form>
        </div>

        {/* Results Panels */}
        <AnimatePresence mode="wait">
          {routes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-4"
            >
              {/* Recommendation banner */}
              {recommended && (
                <div className="bg-linear-to-r from-brand-forest to-emerald-700 text-brand-cream rounded-3xl p-5 shadow-sm border border-brand-forest/20 relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-brand-sage/10 rounded-full blur-xl" />
                  
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-1 bg-yellow-500 rounded text-brand-forest">
                      <Star className="w-3.5 h-3.5 fill-yellow-500" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-brand-cream/80">Mama's Recommendation</span>
                  </div>
                  
                  <h3 className="text-base font-bold font-poppins capitalize">
                    Commute by {recommended.mode === "bicycle" ? "cycling" : recommended.mode}
                  </h3>
                  <p className="text-xxs text-brand-cream/95 mt-1.5 leading-relaxed font-semibold">
                    {recommended.reason}
                  </p>
                  
                  {recommended.mode !== "driving" && (
                    <div className="mt-3 inline-block bg-brand-cream/20 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      ✨ Saves {getCarbonSavedValue(recommended)} kg CO₂ emissions!
                    </div>
                  )}
                </div>
              )}

              {/* Transit alternatives cards */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-brown/70 px-1 block">
                  Commute Route Comparisons
                </span>

                {routes.map((route) => {
                  const Icon = route.icon;
                  const isSelected = selectedMode === route.mode;
                  const savedCo2 = getCarbonSavedValue(route);
                  
                  return (
                    <div
                      key={route.mode}
                      onClick={() => handleSelectRouteMode(route.mode)}
                      className={`glass-card rounded-2xl p-4 flex items-center justify-between border cursor-pointer transition-all select-none ${
                        isSelected 
                          ? "border-brand-forest bg-brand-forest/5 scale-[1.01] shadow-sm" 
                          : "border-brand-sage/15 bg-white/40 hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-brand-forest text-brand-cream" : "bg-brand-sage/10 text-brand-forest"
                        }`}>
                          <Icon className="w-4.5 h-4.5 stroke-[2.5]" />
                        </span>
                        <div>
                          <span className="flex items-center gap-1.5 font-bold text-xs capitalize text-brand-forest">
                            {route.mode === "bicycle" ? "cycling" : route.mode} {route.mode === recommended?.mode && "⭐"}
                            {route.isLowestCarbon && (
                              <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Lowest Carbon
                              </span>
                            )}
                          </span>
                          <span className="text-[9px] text-brand-brown/60 font-semibold">
                            {route.duration} mins • {route.distance} km
                          </span>
                        </div>
                      </div>

                      {/* Math outputs */}
                      <div className="flex gap-4">
                        <div className="text-right">
                          <span className="block text-[8px] font-extrabold text-brand-brown/40 uppercase">Carbon</span>
                          <span className={`text-[10px] font-bold ${route.emissions === 0 ? "text-emerald-600" : "text-brand-brown"}`}>
                            {route.emissions} kg
                          </span>
                          {route.mode !== "car" && (
                            <span className="block text-[8px] text-emerald-600 font-semibold mt-0.5">
                              -{route.co2Saved.toFixed(2)} kg vs car
                            </span>
                          )}
                        </div>

                        {route.calories > 0 && (
                          <div className="text-right">
                            <span className="block text-[8px] font-extrabold text-brand-brown/40 uppercase">Burn</span>
                            <span className="text-[10px] font-bold text-orange-600">
                              +{route.calories} kcal
                            </span>
                          </div>
                        )}

                        <div className="text-right">
                          <span className="block text-[8px] font-extrabold text-brand-brown/40 uppercase">Cost / Saved</span>
                          <span className="text-[10px] font-bold text-brand-brown">
                            ₹{route.cost}
                          </span>
                          {route.mode !== "car" && route.moneySaved > 0 && (
                            <span className="block text-[8px] text-emerald-600 font-semibold mt-0.5">
                              ₹{route.moneySaved} saved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Map Panel (Right side) */}
      <div className="lg:col-span-7 h-105 lg:h-auto min-h-105 rounded-3xl overflow-hidden border border-brand-sage/20 relative shadow-sm bg-brand-cream">
        
        {/* Mapbox Canvas target */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

        {/* Custom GPS Overlay Dashboard */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
          {/* Geolocation permissions warnings if denied */}
          {gpsStatus === "denied" && (
            <div className="glass-panel px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1.5 text-[10px] font-bold max-w-55 shadow">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Permission denied. Enable browser location for precise routing.</span>
            </div>
          )}

          {/* Quick Info Dashboard */}
          {routes.length > 0 && (
            <div className="glass-panel px-4 py-3 rounded-2xl border border-brand-forest/10 bg-white/95 shadow-md flex flex-col gap-1.5 max-w-60">
              <div className="flex items-center gap-1">
                <Compass className="w-4 h-4 text-brand-forest animate-spin-slow" />
                <span className="text-[9px] font-bold text-brand-forest uppercase tracking-wider">Map Navigation Stats</span>
              </div>
              <div className="text-xxs font-semibold text-brand-brown/70 space-y-1">
                <p>📍 Destination: <span className="font-bold text-brand-forest">{destination}</span></p>
                <p>📏 Selected Mode: <span className="font-bold text-brand-forest capitalize">{selectedMode === "bicycle" ? "cycling" : selectedMode}</span></p>
                {selectedMode !== "car" && (
                  <p className="text-emerald-700 font-bold">🌿 Carbon Saved: {routes.find(r => r.mode === selectedMode)?.co2Saved.toFixed(2)} kg CO₂</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Locate Me and Recenter Controls floating panel */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button
            onClick={handleLocateMe}
            title="Locate Me"
            className="p-2.5 rounded-xl bg-white hover:bg-brand-forest/5 border border-brand-sage/25 shadow-md text-brand-forest flex items-center justify-center transition-colors"
          >
            <Locate className="w-4 h-4" />
          </button>
          {destLocation && (
            <button
              onClick={handleRecenter}
              title="Recenter Route View"
              className="p-2.5 rounded-xl bg-white hover:bg-brand-forest/5 border border-brand-sage/25 shadow-md text-brand-forest flex items-center justify-center transition-colors font-bold text-xs"
            >
              📐
            </button>
          )}
        </div>

        {/* Map loading state indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-cream z-10">
            <div className="flex flex-col items-center gap-2 text-brand-forest">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Configuring Vector Street Maps...</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
