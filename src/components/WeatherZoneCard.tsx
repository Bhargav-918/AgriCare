import React from "react";
import { AGRICULTURAL_ZONES } from "../samples";
import { AgriculturalZone } from "../types";
import { MapPin, Thermometer, Droplets, CloudRain, Sprout, ToggleLeft, HelpCircle, Locate } from "lucide-react";

interface WeatherZoneCardProps {
  selectedZone: AgriculturalZone;
  onZoneChange: (zone: AgriculturalZone) => void;
  preferredLanguage: string;
}

export default function WeatherZoneCard({ selectedZone, onZoneChange, preferredLanguage }: WeatherZoneCardProps) {
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);
  const [locationStatus, setLocationStatus] = React.useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
    "Anantapur": { lat: 14.68, lng: 77.60 },
    "Guntur": { lat: 16.30, lng: 80.45 },
    "Kurnool": { lat: 15.83, lng: 78.05 },
    "East Godavari": { lat: 16.98, lng: 82.24 },
    "West Godavari": { lat: 16.70, lng: 81.10 },
    "Chittoor": { lat: 13.21, lng: 79.10 },
    "Nellore": { lat: 14.44, lng: 79.98 },
    "Kadapa": { lat: 14.47, lng: 78.82 },
    "Visakhapatnam": { lat: 17.68, lng: 83.21 },
    "Srikakulam": { lat: 18.30, lng: 83.90 },
    "Vizianagaram": { lat: 18.11, lng: 83.40 },
    "Krishna": { lat: 16.16, lng: 81.13 },
    "Prakasam": { lat: 15.50, lng: 80.05 },
    "Nagpur": { lat: 21.14, lng: 79.08 },
    "Bhatinda": { lat: 30.20, lng: 74.95 },
    "Chikkaballapur": { lat: 13.43, lng: 77.72 },
    "Lucknow": { lat: 26.85, lng: 80.94 },
    "Anand": { lat: 22.56, lng: 72.92 },
    "Burdwan": { lat: 23.24, lng: 87.86 },
    "Jorhat": { lat: 26.75, lng: 94.20 },
    "Indore": { lat: 22.71, lng: 75.85 },
    "Thanjavur": { lat: 10.78, lng: 79.13 },
    "Jodhpur": { lat: 26.23, lng: 73.01 },
    "Shimla": { lat: 31.10, lng: 77.17 },
    "Warangal": { lat: 17.96, lng: 79.59 },
    "Nizamabad": { lat: 18.67, lng: 78.10 },
    "Adilabad": { lat: 19.66, lng: 78.53 },
    "Karimnagar": { lat: 18.43, lng: 79.12 },
    "Mahabubnagar": { lat: 16.73, lng: 77.98 },
    "Nalgonda": { lat: 17.05, lng: 79.26 },
    "Khammam": { lat: 17.24, lng: 80.15 },
    "Medak": { lat: 18.03, lng: 78.26 },
    "Rangareddy": { lat: 17.38, lng: 78.48 },
    "Suryapet": { lat: 17.15, lng: 79.62 },
    "Siddipet": { lat: 18.10, lng: 78.85 },
    "Sangareddy": { lat: 17.60, lng: 78.08 }
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    return Math.sqrt(dLat * dLat + dLon * dLon);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus({
        text: getLabel(
          "Geolocation is not supported by your browser.",
          "आपके ब्राउज़र द्वारा जियोलोकेशन समर्थित नहीं है।",
          "మీ బ్రౌజర్ జియోలొకేషన్ సపోర్ట్ చేయదు."
        ),
        type: "error"
      });
      return;
    }

    setIsLoadingLocation(true);
    setLocationStatus({
      text: getLabel(
        "Requesting GPS location access...",
        "जीपीएस स्थान का अनुरोध किया जा रहा है...",
        "GPS స్థానం కోసం అనుమతి అడుగుతోంది..."
      ),
      type: "info"
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocationStatus({
          text: getLabel(
            `GPS acquired. Finding closest farming zone (Lat: ${latitude.toFixed(3)}, Lng: ${longitude.toFixed(3)})...`,
            `जीपीएस प्राप्त हुआ। निकटतम कृषि क्षेत्र का चयन किया जा रहा है...`,
            `GPS స్థానం గుర్తించబడింది. సమీప వ్యవసాయ జోన్‌ను మ్యాచ్ చేస్తోంది...`
          ),
          type: "info"
        });

        let matchedZone = AGRICULTURAL_ZONES[0];
        let minDistance = Infinity;

        // Find nearest zone by coordinates
        AGRICULTURAL_ZONES.forEach((zone) => {
          const coords = ZONE_COORDINATES[zone.district];
          if (coords) {
            const dist = getDistance(latitude, longitude, coords.lat, coords.lng);
            if (dist < minDistance) {
              minDistance = dist;
              matchedZone = zone;
            }
          }
        });

        // Try reverse geocoding for a highly specific name match
        let finalDistrictName = matchedZone.district;
        let preciseLocalName = "";
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
            { headers: { "User-Agent": "AI-Crop-Doctor-Location-Finder" } }
          );
          if (response.ok) {
            const data = await response.json();
            const address = data.address || {};
            
            // Build a highly readable local name e.g. "Kukatpally, Hyderabad"
            const localParts: string[] = [];
            const sub = address.suburb || address.neighbourhood || address.quarter || address.suburb_district;
            const city = address.city || address.town || address.village || address.city_district || address.county;
            if (sub) localParts.push(sub);
            if (city) localParts.push(city);
            if (localParts.length > 0) {
              preciseLocalName = localParts.join(", ");
            }

            const keysToCheck = [
              address.district,
              address.county,
              address.state_district,
              address.city,
              address.suburb,
              address.town
            ];

            // Look for any exact match in our districts
            for (const key of keysToCheck) {
              if (key) {
                const cleanKey = key.replace(/district/gi, "").trim();
                const found = AGRICULTURAL_ZONES.find(
                  (z) => z.district.toLowerCase() === cleanKey.toLowerCase()
                );
                if (found) {
                  matchedZone = found;
                  finalDistrictName = cleanKey;
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Reverse geocoding failed, falling back to Euclidean distance mapping.", e);
        }

        // Fetch real-time weather of the precise latitude/longitude from Open-Meteo!
        let liveTemp = matchedZone.currentSeasonTemp;
        let liveHumidity = matchedZone.humidity;
        let livePrecipitationChance = matchedZone.precipitationChance;
        let weatherMessage = "";

        try {
          setLocationStatus({
            text: getLabel(
              `Downloading live meteorological telemetry for your precise location...`,
              `आपके सटीक स्थान के लिए लाइव मौसम विज्ञान डेटा डाउनलोड किया जा रहा है...`,
              `మీ ఖచ్చితమైన స్థానం కోసం లైవ్ వాతావరణ సమాచారాన్ని డౌన్లోడ్ చేస్తోంది...`
            ),
            type: "info"
          });

          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation&hourly=precipitation_probability&forecast_days=1`
          );

          if (weatherResponse.ok) {
            const weatherData = await weatherResponse.json();
            if (weatherData.current) {
              const tempVal = weatherData.current.temperature_2m;
              const humidityVal = weatherData.current.relative_humidity_2m;
              const precipitationVal = weatherData.current.precipitation;
              
              if (tempVal !== undefined) {
                liveTemp = `${Math.round(tempVal)}°C`;
              }
              if (humidityVal !== undefined) {
                liveHumidity = `${Math.round(humidityVal)}%`;
              }
              
              // Map precipitation probability from hourly forecast
              if (weatherData.hourly && Array.isArray(weatherData.hourly.precipitation_probability)) {
                const nextHoursProb = weatherData.hourly.precipitation_probability.slice(0, 4);
                const maxProb = nextHoursProb.length > 0 ? Math.max(...nextHoursProb) : 0;
                livePrecipitationChance = `${maxProb}%`;
              } else if (precipitationVal !== undefined) {
                livePrecipitationChance = precipitationVal > 0 ? "85%" : "10%";
              }

              weatherMessage = getLabel(
                ` | Live Weather loaded: ${liveTemp}, Humidity: ${liveHumidity}, Precip: ${livePrecipitationChance}`,
                ` | लाइव मौसम: ${liveTemp}, आर्द्रता: ${liveHumidity}, वर्षा: ${livePrecipitationChance}`,
                ` | లైవ్ శీతోష్ణస్థితి: ${liveTemp}, తేమ: ${liveHumidity}, వర్షపాతం: ${livePrecipitationChance}`
              );
            }
          }
        } catch (weatherErr) {
          console.error("Open-Meteo real time weather download failed. Falling back to zone averages.", weatherErr);
        }

        // Set custom customized AgriculturalZone with live precise coordinates & live weather metrics!
        const liveGeoZone: AgriculturalZone = {
          ...matchedZone,
          regionName: preciseLocalName ? preciseLocalName : `GPS Zone (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`,
          currentSeasonTemp: liveTemp,
          humidity: liveHumidity,
          precipitationChance: livePrecipitationChance
        };

        // Apply selected zone back to main application stage
        onZoneChange(liveGeoZone);
        
        setLocationStatus({
          text: getLabel(
            `🎯 Location: ${preciseLocalName || `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (Matched to ${matchedZone.district} Profile)` + weatherMessage,
            `🎯 स्थान: ${preciseLocalName || `जीपीएस (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (${matchedZone.district} प्रोफाइल से मिलान किया गया)` + weatherMessage,
            `🎯 లొకేషన్: ${preciseLocalName || `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (${matchedZone.district} ప్రొఫైల్‌తో సరిపోలింది)` + weatherMessage
          ),
          type: "success"
        });

        setIsLoadingLocation(false);

        // Clear success notification after 6 seconds
        setTimeout(() => {
          setLocationStatus(null);
        }, 6000);
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMsg = getLabel(
          "Unable to retrieve GPS. Please choose district manually.",
          "जीपीएस स्थान प्राप्त करने में असमर्थ। कृपया जिला स्वयं चुनें।",
          "GPS స్థానం పొందడం విఫలమైంది. దయచేసి జిల్లాను ఎంచుకోండి."
        );
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = getLabel(
            "GPS access denied. Please allow location permissions in your browser.",
            "जीपीएस पहुंच अस्वीकृत। कृपया स्थान अधिकार प्रदान करें।",
            "GPS అనుమతి తిరస్కరించబడింది. దయచేసి లొకేషన్ అనుమతులు ప్రదానం చేయండి."
          );
        }
        setLocationStatus({ text: errorMsg, type: "error" });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleZoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = AGRICULTURAL_ZONES.find(z => z.district === e.target.value);
    if (found) {
      onZoneChange(found);
    }
  };

  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  // Quick helper to translate titles dynamically
  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  return (
    <div 
      id="weather-zone-card"
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              {getLabel("Farmer Eco-Zone Context", "किसान कृषि-क्षेत्र संदर्भ", "రైతు వ్యవసాయ-ప్రాంతం")}
            </h3>
            <p className="text-slate-500 text-[11px]">
              {getLabel("Influences soil & micro-climate diagnostics", "मृदा और सूक्ष्म-जलवायु रिपोर्ट को प्रभावित करता है", "నేల మరియు వాతావరణ ఆధారిత సలహా")}
            </p>
          </div>
        </div>

        {/* Quick Location selection block with GPS detector */}
        <div className="flex items-center space-x-1.5">
          <select
            id="agricultural-zone-dropdown"
            value={selectedZone.district}
            onChange={handleZoneSelect}
            className="text-xs font-medium border border-slate-200 rounded-lg p-1.5 bg-white text-slate-700 outline-none focus:border-emerald-500 cursor-pointer max-w-[130px] sm:max-w-[170px]"
          >
            {AGRICULTURAL_ZONES.map((zone) => (
              <option key={zone.district} value={zone.district}>
                📍 {zone.district}, {zone.state}
              </option>
            ))}
          </select>

          <button
            id="gps-location-button"
            type="button"
            onClick={handleDetectLocation}
            disabled={isLoadingLocation}
            className={`p-1.5 bg-white border border-slate-200 rounded-lg hover:border-emerald-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
            title={getLabel("Detect My Location", "मेरी स्थिति खोजें", "నా స్థానాన్ని గుర్తించండి")}
          >
            <Locate className={`w-4 h-4 ${isLoadingLocation ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Dynamic GPS tracking and status banner */}
        {locationStatus && (
          <div 
            id="gps-status-banner"
            className={`p-3 rounded-xl text-xs flex justify-between items-center transition-all animate-none ${
              locationStatus.type === "success" 
                ? "bg-emerald-50 border border-emerald-100 text-emerald-800"
                : locationStatus.type === "error"
                  ? "bg-rose-50 border border-rose-100 text-rose-800"
                  : "bg-teal-50 border border-teal-100 text-teal-800"
            }`}
          >
            <span className="font-medium pr-2 leading-relaxed">{locationStatus.text}</span>
            <button 
              id="close-gps-status-btn"
              type="button"
              onClick={() => setLocationStatus(null)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Dynamic weather indicators */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex flex-col items-center text-center">
            <Thermometer className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-[10px] text-amber-800 font-medium uppercase tracking-wider block">Temp</span>
            <span id="zone-temp-value" className="text-sm font-semibold text-slate-800 mt-0.5">{selectedZone.currentSeasonTemp}</span>
          </div>

          <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 flex flex-col items-center text-center">
            <Droplets className="w-5 h-5 text-sky-600 mb-1" />
            <span className="text-[10px] text-sky-800 font-medium uppercase tracking-wider block">Air Humidity</span>
            <span id="zone-humidity-value" className="text-sm font-semibold text-slate-800 mt-0.5">{selectedZone.humidity}</span>
          </div>

          <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex flex-col items-center text-center">
            <CloudRain className="w-5 h-5 text-indigo-600 mb-1" />
            <span className="text-[10px] text-indigo-800 font-medium uppercase tracking-wider block">Rain Chance</span>
            <span id="zone-rain-value" className="text-sm font-semibold text-slate-800 mt-0.5">{selectedZone.precipitationChance}</span>
          </div>
        </div>

        {/* Diagnostic parameters summary */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100 text-xs">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">{getLabel("Region Name", "क्षेत्र का नाम", "ప్రాంతం పేరు")}:</span>
            <span className="text-slate-800 font-semibold">{selectedZone.regionName}</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">{getLabel("Ground Soil Classification", "मिट्टी का वर्गीकरण", "నేల రకం")}:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold text-[11px]">
              {selectedZone.soilType}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">{getLabel("Climate Profile", "जलवायु का स्वरूप", "వాతావరణం")}:</span>
            <span className="text-slate-800 font-semibold text-right">{selectedZone.climate}</span>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <span className="text-slate-500 block font-medium mb-1.5 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5 text-emerald-600" />
              {getLabel("Dominant Crops in Season", "इस मौसम की प्रमुख फसलें", "ఈ సీజన్ లో పండే పంటలు")}
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedZone.primaryCrops.map((crop, i) => (
                <span 
                  key={i} 
                  className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
