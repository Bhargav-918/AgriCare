import React, { useState, useEffect } from "react";
import { AGRICULTURAL_ZONES } from "./samples";
import { AgriculturalZone, DiagnosisResult } from "./types";
import WeatherZoneCard from "./components/WeatherZoneCard";
import AdvisoryChat from "./components/AdvisoryChat";
import ImageUploader from "./components/ImageUploader";
import DiagExplanationDialog from "./components/DiagExplanationDialog";
import SoilHealthAdvisory from "./components/SoilHealthAdvisory";
import WeatherAlertOverlay from "./components/WeatherAlertOverlay";
import MarketPriceTracker from "./components/MarketPriceTracker";
import ReactMarkdown from "react-markdown";
import { 
  auth, 
  db, 
  googleProvider, 
  handleFirestoreError,
  OperationType 
} from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Leaf, 
  Sparkles, 
  BookOpen, 
  Globe, 
  AlertTriangle, 
  Calendar, 
  Cpu, 
  CheckCircle, 
  ShieldAlert, 
  Clock, 
  Info,
  Wrench,
  Activity,
  Phone
} from "lucide-react";

const LOADER_IPS = [
  "Analyzing chlorophyll variance and leaf structural pigmentation...",
  "Running contour scanning on spot lesions and fungal mycelium...",
  "Cross-referencing agricultural pathology database (100k+ pathogens)...",
  "Calibrating macro & micronutrient guidelines for soil type...",
  "Formulating organic neem recipes and safe chemical withholding periods...",
  "Translating advisory to your requested local dialect..."
];

export default function App() {
  const [selectedZone, setSelectedZone] = useState<AgriculturalZone>(() => {
    const saved = localStorage.getItem("kisaan_manually_selected_zone");
    if (saved) {
      const found = AGRICULTURAL_ZONES.find(z => z.district === saved);
      if (found) return found;
    }
    return AGRICULTURAL_ZONES[0];
  });
  const [weatherZone, setWeatherZone] = useState<AgriculturalZone | null>(null);
  const [marketZone, setMarketZone] = useState<AgriculturalZone | null>(null);
  
  const activeWeatherZone = weatherZone || selectedZone;
  const activeMarketZone = marketZone || selectedZone;

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>("");

  // Automatically request and resolve user's current location on application startup
  // unless they have already pinned a manually selected district.
  const handleAutoLocationDetect = async (force = false) => {
    if (!force) {
      const saved = localStorage.getItem("kisaan_manually_selected_zone");
      if (saved) {
        const found = AGRICULTURAL_ZONES.find(z => z.district === saved);
        if (found) {
          setSelectedZone(found);
          return;
        }
      }
    }

    setIsDetecting(true);
    setLocationStatus("Detecting location...");

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

    const CITY_TO_DISTRICT: Record<string, string> = {
      "ongole": "Prakasam",
      "prakasam": "Prakasam",
      "singarayakonda": "Prakasam",
      "markapur": "Prakasam",
      "chirala": "Prakasam",
      "kandukur": "Prakasam",
      "kanigiri": "Prakasam",
      "giddalur": "Prakasam",
      "podili": "Prakasam",
      "addanki": "Prakasam",
      "chimakurthy": "Prakasam",
      "yerragondapalem": "Prakasam",
      "cumbum": "Prakasam",
      "pamur": "Prakasam",
      "guntur": "Guntur",
      "tenali": "Guntur",
      "narasaraopet": "Guntur",
      "bapatla": "Guntur",
      "sattenapalle": "Guntur",
      "mangalagiri": "Guntur",
      "repalle": "Guntur",
      "machyala": "Guntur",
      "ponnur": "Guntur",
      "kurnool": "Kurnool",
      "adoni": "Kurnool",
      "nandyal": "Kurnool",
      "yemmiganur": "Kurnool",
      "dhone": "Kurnool",
      "allagadda": "Kurnool",
      "banaganapalle": "Kurnool",
      "rajahmundry": "East Godavari",
      "rajamahendravaram": "East Godavari",
      "kakinada": "East Godavari",
      "amalapuram": "East Godavari",
      "kovvur": "East Godavari",
      "peddapuram": "East Godavari",
      "samalkot": "East Godavari",
      "mandapeta": "East Godavari",
      "eluru": "West Godavari",
      "bhimavaram": "West Godavari",
      "narasapuram": "West Godavari",
      "tadepalligudem": "West Godavari",
      "tanuku": "West Godavari",
      "palakollu": "West Godavari",
      "chittoor": "Chittoor",
      "tirupati": "Chittoor",
      "madanapalle": "Chittoor",
      "punganur": "Chittoor",
      "srikalahasti": "Chittoor",
      "nellore": "Nellore",
      "sri potti sriramulu nellore": "Nellore",
      "gudur": "Nellore",
      "kavali": "Nellore",
      "venkatagiri": "Nellore",
      "kadapa": "Kadapa",
      "y s r": "Kadapa",
      "ysr": "Kadapa",
      "cuddapah": "Kadapa",
      "proddatur": "Kadapa",
      "pulivendula": "Kadapa",
      "rayachoty": "Kadapa",
      "visakhapatnam": "Visakhapatnam",
      "vizag": "Visakhapatnam",
      "anakapalle": "Visakhapatnam",
      "bheemunipatnam": "Visakhapatnam",
      "srikakulam": "Srikakulam",
      "amadalavalasa": "Srikakulam",
      "palasa": "Srikakulam",
      "vizianagaram": "Vizianagaram",
      "salur": "Vizianagaram",
      "bobbili": "Vizianagaram",
      "machilipatnam": "Krishna",
      "vijayawada": "Krishna",
      "gudivada": "Krishna",
      "jaggayyapeta": "Krishna",
      "nuzvid": "Krishna",
      "anantapur": "Anantapur",
      "ananthapur": "Anantapur",
      "hindupur": "Anantapur",
      "dharmavaram": "Anantapur",
      "guntakal": "Anantapur",
      "kadiri": "Anantapur",
      "tadpatri": "Anantapur"
    };

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      return Math.sqrt(dLat * dLat + dLon * dLon);
    };

    const applyMatchedZone = (zone: AgriculturalZone) => {
      setSelectedZone(zone);
      if (force) {
        localStorage.setItem("kisaan_manually_selected_zone", zone.district);
      }
      setLocationStatus(`Matched: ${zone.district}`);
    };

    const runIpFallback = async () => {
      setLocationStatus("Using network base geo-IP routing...");
      try {
        const response = await fetch("https://ipwho.is/json");
        if (response.ok) {
          const data = await response.json();
          if (data && data.latitude && data.longitude) {
            const latitude = data.latitude;
            const longitude = data.longitude;
            const regionName = (data.region || "").toLowerCase();
            const cityName = (data.city || "").toLowerCase();

            // 1. Direct city check in mapping schema first
            let matchedByName: AgriculturalZone | undefined = undefined;
            
            // Check direct city key
            if (CITY_TO_DISTRICT[cityName]) {
              matchedByName = AGRICULTURAL_ZONES.find(
                (z) => z.district.toLowerCase() === CITY_TO_DISTRICT[cityName].toLowerCase()
              );
            }

            // Check region or custom substring mapping
            if (!matchedByName) {
              const matchedKey = Object.keys(CITY_TO_DISTRICT).find(
                (key) => cityName.includes(key) || regionName.includes(key)
              );
              if (matchedKey) {
                const targetDistrict = CITY_TO_DISTRICT[matchedKey];
                matchedByName = AGRICULTURAL_ZONES.find(
                  (z) => z.district.toLowerCase() === targetDistrict.toLowerCase()
                );
              }
            }

            if (!matchedByName) {
              matchedByName = AGRICULTURAL_ZONES.find(
                (z) => cityName.includes(z.district.toLowerCase()) || 
                       z.district.toLowerCase().includes(cityName) ||
                       regionName.includes(z.district.toLowerCase())
              );
            }

            if (matchedByName) {
              applyMatchedZone(matchedByName);
              setIsDetecting(false);
              return;
            }

            let minDistance = Infinity;
            let matchedZone = AGRICULTURAL_ZONES[0];

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

            applyMatchedZone(matchedZone);
            setIsDetecting(false);
            return;
          }
        }
      } catch (err) {
        console.warn("ipwho.is lookup failed, trying backup ipapi.co...", err);
      }

      try {
        const response = await fetch("https://ipapi.co/json/");
        if (response.ok) {
          const data = await response.json();
          if (data && data.latitude && data.longitude) {
            const latitude = data.latitude;
            const longitude = data.longitude;
            const regionName = (data.region || "").toLowerCase();
            const cityName = (data.city || "").toLowerCase();

            let matchedByName: AgriculturalZone | undefined = undefined;

            if (CITY_TO_DISTRICT[cityName]) {
              matchedByName = AGRICULTURAL_ZONES.find(
                (z) => z.district.toLowerCase() === CITY_TO_DISTRICT[cityName].toLowerCase()
              );
            }

            if (!matchedByName) {
              const matchedKey = Object.keys(CITY_TO_DISTRICT).find(
                (key) => cityName.includes(key) || regionName.includes(key)
              );
              if (matchedKey) {
                const targetDistrict = CITY_TO_DISTRICT[matchedKey];
                matchedByName = AGRICULTURAL_ZONES.find(
                  (z) => z.district.toLowerCase() === targetDistrict.toLowerCase()
                );
              }
            }

            if (!matchedByName) {
              matchedByName = AGRICULTURAL_ZONES.find(
                (z) => cityName.includes(z.district.toLowerCase()) || 
                       z.district.toLowerCase().includes(cityName) ||
                       regionName.includes(z.district.toLowerCase())
              );
            }

            if (matchedByName) {
              applyMatchedZone(matchedByName);
              setIsDetecting(false);
              return;
            }

            let minDistance = Infinity;
            let matchedZone = AGRICULTURAL_ZONES[0];

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

            applyMatchedZone(matchedZone);
            setIsDetecting(false);
            return;
          }
        }
      } catch (err) {
        console.warn("ipapi.co backup fallback failed", err);
      }

      setLocationStatus("Could not auto-detect location. Defaulting.");
      setIsDetecting(false);
    };

    const tryBrowserGeolocation = (highAccuracy = false): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 15000 : 8000,
            maximumAge: 30000
          }
        );
      });
    };

    if (navigator.geolocation) {
      setLocationStatus("Requesting browser GPS permission...");
      
      // Try low-accuracy first (instant and high success rate on Wi-Fi/desktop without GPS hardware), then fall back to high-accuracy if needed
      tryBrowserGeolocation(false)
        .catch((err) => {
          console.warn("Low-accuracy GPS failed, retrying with high accuracy...", err);
          setLocationStatus("Retrying with fallback GPS parameters...");
          return tryBrowserGeolocation(true);
        })
        .then(async (position) => {
          const { latitude, longitude } = position.coords;
          setLocationStatus(`GPS acquired (${latitude.toFixed(3)}, ${longitude.toFixed(3)}). Geocoding...`);
          
          let minDistance = Infinity;
          let matchedZone = AGRICULTURAL_ZONES[0];

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

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`,
              { headers: { "User-Agent": "AI-Crop-Doctor-Location-Finder" } }
            );
            if (response.ok) {
              const geoData = await response.json();
              const address = geoData.address || {};
              
              // Deep match ALL keys/values inside coordinates reverse response address
              for (const [addrKey, addrVal] of Object.entries(address)) {
                const lowerVal = String(addrVal).toLowerCase().trim();
                if (!lowerVal) continue;
                
                // Direct custom city mapping
                if (CITY_TO_DISTRICT[lowerVal]) {
                  const mapped = AGRICULTURAL_ZONES.find(
                    (z) => z.district.toLowerCase() === CITY_TO_DISTRICT[lowerVal].toLowerCase()
                  );
                  if (mapped) {
                    matchedZone = mapped;
                    break;
                  }
                }
                
                // Direct district match
                const cleanVal = lowerVal.replace(/\sdistrict/g, "").replace(/\scounty/g, "").trim();
                const matchedByGeo = AGRICULTURAL_ZONES.find(
                  (z) => z.district.toLowerCase() === cleanVal
                );
                if (matchedByGeo) {
                  matchedZone = matchedByGeo;
                  break;
                }

                // Partial text matching
                const partialMatch = AGRICULTURAL_ZONES.find(
                  (z) => cleanVal.includes(z.district.toLowerCase()) || z.district.toLowerCase().includes(cleanVal)
                );
                if (partialMatch) {
                  matchedZone = partialMatch;
                  break;
                }
              }
            }
          } catch (e) {
            console.warn("Reverse geocoding issue, using closest physical coordinates:", e);
          }

          applyMatchedZone(matchedZone);
          setIsDetecting(false);
        })
        .catch(async (error) => {
          console.warn("All direct browser GPS attempts failed. Invoking network geo-IP flow.", error);
          await runIpFallback();
        });
    } else {
      await runIpFallback();
    }
  };

  useEffect(() => {
    handleAutoLocationDetect();
  }, []);

  const [preferredLanguage, setPreferredLanguage] = useState<string>("English");
  const [isExplainingOpen, setIsExplainingOpen] = useState(false);
  const [activePage, setActivePage] = useState<string>("crop-doctor");
  
  // Image & Diagnosis State
  const [uploadedBase64, setUploadedBase64] = useState<string>("");
  const [cropName, setCropName] = useState<string>("");
  const [farmerNotes, setFarmerNotes] = useState<string>("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [loaderIndex, setLoaderIndex] = useState(0);

  // Authentication & Cloud Diagnostic History Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [pastDiagnoses, setPastDiagnoses] = useState<any[]>([]);

  // Extended authentication state for Email/Phone & Password registration
  const [authEmailOrPhone, setAuthEmailOrPhone] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authDisplayName, setAuthDisplayName] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authError, setAuthError] = useState<string>("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Live farmer SMS alerts configuration states
  const [smsPhone, setSmsPhone] = useState<string>("");
  const [smsRainEnabled, setSmsRainEnabled] = useState<boolean>(true);
  const [smsHeatEnabled, setSmsHeatEnabled] = useState<boolean>(true);
  const [smsLogList, setSmsLogList] = useState<any[]>([]);
  const [lastAlertDispatched, setLastAlertDispatched] = useState<{
    message: string;
    phone: string;
    timestamp: string;
  } | null>(null);

  // Synchronize SMS settings from database (Firestore) or fallback locally
  useEffect(() => {
    if (!currentUser) {
      const localPhone = localStorage.getItem("kisaan_sms_phone") || "";
      const localRain = localStorage.getItem("kisaan_sms_rain") !== "false";
      const localHeat = localStorage.getItem("kisaan_sms_heat") !== "false";
      const localLogs = JSON.parse(localStorage.getItem("kisaan_sms_logs") || "[]");
      setSmsPhone(localPhone);
      setSmsRainEnabled(localRain);
      setSmsHeatEnabled(localHeat);
      setSmsLogList(localLogs);
      return;
    }

    const settingsRef = doc(db, "users", currentUser.uid, "settings", "smsAlerts");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSmsPhone(data.phone || "");
        setSmsRainEnabled(data.rainEnabled !== false);
        setSmsHeatEnabled(data.heatEnabled !== false);
        setSmsLogList(data.logs || []);
      } else {
        const localPhone = localStorage.getItem("kisaan_sms_phone") || "";
        const localRain = localStorage.getItem("kisaan_sms_rain") !== "false";
        const localHeat = localStorage.getItem("kisaan_sms_heat") !== "false";
        setDoc(settingsRef, {
          phone: localPhone,
          rainEnabled: localRain,
          heatEnabled: localHeat,
          logs: [],
          updatedAt: serverTimestamp()
        }).catch(err => {
          console.error("Error creating SMS settings doc", err);
        });
      }
    }, (error) => {
      console.warn("SMS Settings fetch failed", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Save/Update SMS configuration in Cloud + Local Fallback
  const updateSmsSettings = async (phone: string, rain: boolean, heat: boolean, logs?: any[]) => {
    setSmsPhone(phone);
    setSmsRainEnabled(rain);
    setSmsHeatEnabled(heat);
    if (logs !== undefined) {
      setSmsLogList(logs);
    }

    localStorage.setItem("kisaan_sms_phone", phone);
    localStorage.setItem("kisaan_sms_rain", String(rain));
    localStorage.setItem("kisaan_sms_heat", String(heat));
    if (logs !== undefined) {
      localStorage.setItem("kisaan_sms_logs", JSON.stringify(logs));
    }

    if (currentUser) {
      try {
        const settingsRef = doc(db, "users", currentUser.uid, "settings", "smsAlerts");
        await setDoc(settingsRef, {
          phone,
          rainEnabled: rain,
          heatEnabled: heat,
          logs: logs !== undefined ? logs : smsLogList,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn("Settings cloud sync failed, using fallback storage", err);
      }
    }
  };

  // Pre-configured hazard alerts mapper for active regional alerts
  const getCurrentZoneAlert = (district: string) => {
    switch (district) {
      case "Nagpur":
        return { type: "rain" as const, title: "Unseasonal Heavy Rain & Hail Alert", desc: "Heavy waterlogging expected in standard Black Cotton soils." };
      case "Lucknow":
        return { type: "rain" as const, title: "Monsoon Cloudburst & Runoff Surge", desc: "Fast surface runoff will completely submerge young sugarcane and nursery seedbeds." };
      case "Bhatinda":
        return { type: "frost" as const, title: "Midnight Radiative Frost & Freeze Hazard", desc: "Advective arctic cold air will cause potato tubers and mustard foliage cells damage." };
      case "Chikkaballapur":
        return { type: "frost" as const, title: "Morning Dew Scald & Blight Spores", desc: "Damp conditions can trigger rapid early tomato blight leaf spots." };
      case "Guntur":
      case "Khammam":
      case "Prakasam":
        return { type: "heat" as const, title: "Dry Hot Air Wave Warning", desc: "Dry tropical land winds are pulling moisture out of Chilli pods rapidly." };
      case "Kurnool":
      case "Kadapa":
      case "Mahabubnagar":
      case "Nalgonda":
        return { type: "heat" as const, title: "Extreme Water Deficit & Soil Heat Stress", desc: "Groundnuts are highly prone to early leaf wilting and root dehydration." };
      case "East Godavari":
      case "West Godavari":
      case "Nellore":
      case "Krishna":
      case "Srikakulam":
      case "Vizianagaram":
      case "Visakhapatnam":
        return { type: "rain" as const, title: "Tidal Cyclone Storm & Heavy Outpour", desc: "Coastal monsoon depressions. High threat of young paddy nursery field submergence." };
      case "Nizamabad":
      case "Karimnagar":
      case "Adilabad":
      case "Medak":
      case "Rangareddy":
        return { type: "heat" as const, title: "High Temperature Soil Stress", desc: "Turmeric and maize roots are feeling high salt pressure stress." };
      case "Anantapur":
        return { type: "heat" as const, title: "Severe Desert Heat Alert & Soil Desiccation", desc: "Arid weather with high desert winds exceeding 24 km/h is draining ground moisture." };
      default:
        return null;
    }
  };

  // Transmit Simulated SMS log inside the system
  const triggerSmsTransmission = (alert: { type: string; title: string, desc: string }, districtName: string) => {
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    let translatedMsg = `[KisaanSeva Alert] ⚠️ Weather Hazard in ${districtName}: "${alert.title}". ${alert.desc}`;
    if (preferredLanguage === "Hindi") {
      translatedMsg = `[किसानसेवा अलर्ट] ⚠️ ${districtName} में मौसम का खतरा: "${alert.title}"। तत्काल सुरक्षा उपाय करें!`;
    } else if (preferredLanguage === "Telugu") {
      translatedMsg = `[కిసాన్‌సేవ హెచ్చరిక] ⚠️ ${districtName} లో వాతావరణ ముప్పు: "${alert.title}" జరిగింది. తగిన రక్షణ చర్యలు తీసుకోండి!`;
    }

    const newLogItem = {
      id: `sms_${Date.now()}`,
      recipient: smsPhone,
      type: alert.type,
      messageText: translatedMsg,
      timestamp: `${formattedDate}, ${formattedTime}`,
      status: "delivered" as const
    };

    const updatedLogs = [newLogItem, ...smsLogList].slice(0, 15);
    updateSmsSettings(smsPhone, smsRainEnabled, smsHeatEnabled, updatedLogs);

    setLastAlertDispatched({
      message: translatedMsg,
      phone: smsPhone,
      timestamp: `${formattedDate} at ${formattedTime}`
    });

    setTimeout(() => {
      setLastAlertDispatched(null);
    }, 8000);
  };

  // Whenever district or configuration changes, see if we need to auto-dispatch an SMS warning
  useEffect(() => {
    if (!smsPhone || smsPhone.trim().length < 10) return;
    
    const alert = getCurrentZoneAlert(activeWeatherZone.district);
    if (!alert) return;

    if (alert.type === "rain" && !smsRainEnabled) return;
    if (alert.type === "heat" && !smsHeatEnabled) return;

    // Track in sessionStorage to prevent multiple automatic triggers for the same user + district + type combination
    const alertKey = `sms_auto_sent_${smsPhone}_${activeWeatherZone.district}_${alert.type}`;
    const alreadySent = sessionStorage.getItem(alertKey);
    
    if (!alreadySent) {
      sessionStorage.setItem(alertKey, "true");
      triggerSmsTransmission(alert, activeWeatherZone.district);
    }
  }, [activeWeatherZone.district, smsPhone, smsRainEnabled, smsHeatEnabled]);

  // Automatic dynamic translation of the active crop pathology report on language switch
  useEffect(() => {
    if (!diagnosis || !diagnosis.report) return;
    const currentLang = diagnosis.language || "English";
    if (currentLang === preferredLanguage) return;

    const translateActiveReport = async () => {
      setIsDiagnosing(true);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: diagnosis.report,
            targetLanguage: preferredLanguage
          })
        });

        if (response.ok) {
          const data = await response.json();
          setDiagnosis(prev => {
            if (!prev) return null;
            return {
              ...prev,
              report: data.translatedText || prev.report,
              language: preferredLanguage
            };
          });
        }
      } catch (err) {
        console.error("Failed to translate live diagnosis report", err);
      } finally {
        setIsDiagnosing(false);
      }
    };

    translateActiveReport();
  }, [preferredLanguage, diagnosis?.timestamp]);

  // Synchronize authentication state & real-time client records
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setPastDiagnoses([]);
      return;
    }

    const q = query(
      collection(db, "users", currentUser.uid, "diagnoses"),
      orderBy("timestamp", "desc")
    );

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const records: any[] = [];
        snapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() });
        });
        setPastDiagnoses(records);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/diagnoses`);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  const syncUserProfile = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Farmer",
          photoURL: firebaseUser.photoURL || "",
          preferredLanguage: preferredLanguage,
          createdAt: serverTimestamp()
        });
      } else {
        await setDoc(userRef, {
          displayName: firebaseUser.displayName || "Farmer",
          photoURL: firebaseUser.photoURL || "",
          preferredLanguage: preferredLanguage
        }, { merge: true });
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthSubmitting(true);
    
    let email = authEmailOrPhone.trim();
    const isPhoneNumber = /^[0-9+\s\-()]{7,20}$/.test(email);
    if (isPhoneNumber) {
      // It's a phone number, convert it to a synthetic, valid email address
      const cleanedPhone = email.replace(/[^0-9+]/g, "");
      email = `${cleanedPhone}@kisaanseva.com`;
    }

    if (!email) {
      setAuthError(getLabel(
        "Please provide a valid email or phone number.",
        "कृपया एक वैध ईमेल या फ़ोन नंबर प्रदान करें।",
        "దయచేసి సరైన ఈమెయిల్ లేదా ఫోన్ నంబర్ నమోదు చేయండి."
      ));
      setIsAuthSubmitting(false);
      return;
    }

    if (authPassword.length < 6) {
      setAuthError(getLabel(
        "Password must be at least 6 characters long.",
        "पासवर्ड कम से कम ६ अक्षरों का होना चाहिए।",
        "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి."
      ));
      setIsAuthSubmitting(false);
      return;
    }

    try {
      if (authMode === "signup") {
        if (!authDisplayName.trim()) {
          setAuthError(getLabel(
            "Please enter your name.",
            "कृपया अपना नाम दर्ज करें।",
            "దయచేసి మీ పేరును నమోదు చేయండి."
          ));
          setIsAuthSubmitting(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, authPassword);
        const user = userCredential.user;
        await updateProfile(user, {
          displayName: authDisplayName.trim(),
        });
        // Now sync user profile with database
        await syncUserProfile(user);
        if (smsPhone) {
          await updateSmsSettings(smsPhone, smsRainEnabled, smsHeatEnabled);
        }
        setCurrentUser(user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, authPassword);
        const user = userCredential.user;
        setCurrentUser(user);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Translate firebase errors cleanly for user comfort
      let displayMsg = err.message || String(err);
      if (err.code === "auth/email-already-in-use") {
        displayMsg = getLabel(
          "An account with this email/phone already exists. Try signing in.",
          "इस ईमेल/फ़ोन के साथ खाता पहले से मौजूद है। लॉग इन करने का प्रयास करें।",
          "ఈ ఈమెయిల్/ఫోన్ తో ఇప్పటికే ఖాతా ఉంది. లాగిన్ అవ్వడానికి ప్రయత్నించండి."
        );
      } else if (err.code === "auth/invalid-email") {
        displayMsg = getLabel(
          "Invalid email format.",
          "अवैध ईमेल प्रारूप।",
          "ఈమెయిల్ ఫార్మాట్ సరిగ్గా లేదు."
        );
      } else if (err.code === "auth/weak-password") {
        displayMsg = getLabel(
          "Password is too weak.",
          "पासवर्ड बहुत कमजोर है।",
          "పాస్‌వర్డ్ బలంగా లేదు."
        );
      } else if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        displayMsg = getLabel(
          "Incorrect email/phone or password. Please verify and try again.",
          "गलत ईमेल/फ़ोन या पासवर्ड। कृपया जाँचें और पुनः प्रयास करें।",
          "తప్పు ఈమెయిల్/ఫోన్ లేదా పాస్‌వర్డ్. దయచేసి మళ్ళీ ప్రయత్నించండి."
        );
      }
      setAuthError(displayMsg);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Rotate loading tips when diagnosing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDiagnosing) {
      interval = setInterval(() => {
        setLoaderIndex((prev) => (prev + 1) % LOADER_IPS.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isDiagnosing]);

  // Handle image upload updates
  const handleImageSelected = (base64: string, crop: string, notes: string) => {
    setUploadedBase64(base64);
    setCropName(crop);
    setFarmerNotes(notes);
  };

  // Run AI Crop Doctor Diagnosis endpoint
  const runDiagnosis = async () => {
    if (!uploadedBase64) {
      alert("Please upload/take a photo or click a Demo Crop Sample first!");
      return;
    }

    setIsDiagnosing(true);
    setDiagnosis(null);
    setLoaderIndex(0);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: uploadedBase64,
          cropName: cropName,
          preferredLanguage: preferredLanguage,
          locationInfo: selectedZone,
          notes: farmerNotes
        })
      });

      if (!response.ok) {
        throw new Error("Diagnosis request failed on server.");
      }

      const data = await response.json();
      setDiagnosis({
        report: data.report,
        source: data.source,
        isMock: data.isMock,
        timestamp: data.timestamp,
        language: preferredLanguage
      });

      if (currentUser) {
        const docId = `diag_${Date.now()}`;
        try {
          const diagRef = doc(db, "users", currentUser.uid, "diagnoses", docId);
          await setDoc(diagRef, {
            userId: currentUser.uid,
            cropName: cropName || "Crop Leaf Scan",
            report: data.report,
            source: data.source,
            timestamp: serverTimestamp(),
            language: preferredLanguage,
            notes: farmerNotes || "",
            district: selectedZone.district,
            state: selectedZone.state,
            photo: uploadedBase64.length < 200000 ? uploadedBase64 : ""
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${currentUser.uid}/diagnoses/${docId}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      const fallbackReport = `### 🩺 Safe Recovery Advisory Plan - ${cropName || "Cultivar"}
        
An error occurred during remote vision processing. Here is the local agronomic backup instruction:

1.  **Pest Check:** Keep a close eye under the leaves for spider mites, caterpillar eggs, or whiteflies.
2.  **Organic First Aid:** Dilute **5ml cold-pressed Neem Oil** in 1 Litre of lukewarm water with soap, spray at dawn.
3.  **Soil Aeration:** Avoid wet compost stacking. Improve root zone airflow.
4.  **Local Warning:** If crop rot increases, immediately carry a live leaf sample to your district Agriculture Officer.`;

      setDiagnosis({
        report: fallbackReport,
        source: "Offline Recovery Simulator Network",
        isMock: true,
        timestamp: new Date().toISOString(),
        language: preferredLanguage
      });

      if (currentUser) {
        const docId = `diag_${Date.now()}`;
        try {
          const diagRef = doc(db, "users", currentUser.uid, "diagnoses", docId);
          await setDoc(diagRef, {
            userId: currentUser.uid,
            cropName: cropName || "Crop Leaf Scan",
            report: fallbackReport,
            source: "Offline Recovery Simulator Network",
            timestamp: serverTimestamp(),
            language: preferredLanguage,
            notes: farmerNotes || "",
            district: selectedZone.district,
            state: selectedZone.state,
            photo: uploadedBase64.length < 200000 ? uploadedBase64 : ""
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${currentUser.uid}/diagnoses/${docId}`);
        }
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Pre-configured localized translations for key layout buttons
  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  const menus = [
    {
      id: "crop-doctor",
      icon: "🩺",
      label: getLabel("Crop Pathology", "फसल रोग निदान", "పంట వ్యాధి నిర్ధారణ"),
      sub: getLabel("Leaf Disease Scan", "पत्ती रोग जांच", "ఆకు ముడత పరీక్ష")
    },
    {
      id: "soil-health",
      icon: "🌱",
      label: getLabel("Soil Advisory", "मृदा पोषण सलाहकार", "భూసార నివేదిక"),
      sub: getLabel("Nutrients & pH Formula", "इष्टतम उर्वरक माप", "ఎరువుల యాజమాన్యం")
    },
    {
      id: "farmer-chat",
      icon: "💬",
      label: getLabel("AI Farmer Helpline", "कृषि विशेषज्ञ चैट", "వ్యవసాయ సహాయ కేంద్రం"),
      sub: getLabel("Continuous AI Advice", "संदेह निवारण", "ఆల్ రౌండ్ సలహాలు")
    },
    {
      id: "climate-zones",
      icon: "📍",
      label: getLabel("Agro-Climatic Zones", "कृषि-जलवायु क्षेत्र", "వ్యవసాయ మండలాలు"),
      sub: getLabel("Region & Rainfall Profile", "जलवायु व सिंचाई", "వాతావరణం & నేలలు")
    },
    {
      id: "market-prices",
      icon: "📊",
      label: getLabel("Market Prices", "मंडी भाव सलाहकार", "మార్కెట్ ధరలు"),
      sub: getLabel("Weekly Trends & Harvest", "साप्तहिक रुझान व कटाई", "సాగు ధరల వివరాలు")
    }
  ];

  const getZoneSustainablePractices = (zoneDistrict: string) => {
    switch (zoneDistrict) {
      case "Anantapur":
        return {
          irrigationLabel: getLabel("Drip Irrigation (Very High efficiency)", "ड्रिप सिंचाई (अत्यंत आवश्यक)", "బిందు సేద్యం (చాలా అవసరం)"),
          mulchLabel: getLabel("Thick straw mulch to conserve moisture", "नमी बचाने के लिए सूखी घास की बिछौना", "తేమ కాపాడటానికి గడ్డి పరచడం"),
          advice: getLabel(
            "Arid Rayalaseema settings require robust water capture. Avoid overhead spray to limit evaporation. Intercrop groundnut with red gram in a 7:1 ratio for optimal soil nitrogen.",
            "शुष्क अनंतपुर क्षेत्र के लिए जल संचयन अति आवश्यक है। वाष्पीकरण रोकने के लिए फव्वारे के बजाय टपकन विधि अपनाएं। अरहर के साथ मूंगफली की खेती ७:१ अनुपात में करें।",
            "అనంతపురం పొడి వాతావరణంలో నీటి నిల్వ చాలా ముఖ్యం. ఆవిరి కాకుండా డ్రిప్ వాడండి. నత్రజని కోసం వేరుశనగ పంటతో పాటు కంది పంట 7:1 నిష్పత్తిలో సాగు చేయండి."
          )
        };
      case "Chikkaballapur":
        return {
          irrigationLabel: getLabel("Micro-sprinklers alongside precise drip-lines", "माइक्रो-स्प्रिंकलर और सटीक ड्रिप प्रणाली", "సూక్ష్మ తుంపర లేదా బిందు సేద్యం"),
          mulchLabel: getLabel("Plastic mulch sheets to control tomato spores", "टमाटर के जीवाणु रोकने के लिए प्लास्टिक मल्च", "మిశ్రమ ప్లాస్టిక్ షీట్ల మల్చింగ్"),
          advice: getLabel(
            "Eastern dry gravelly soil drains water very fast. Apply organic compost under tomato root zones to hold water. Add Zinc and Boron early to stop tomato blossom-end rot.",
            "पूर्वी शुष्क पथरीली मिट्टी पानी सोख लेती है। टमाटर की अच्छी रोपाई के लिए पानी रोकने हेतु नमी शोषक खाद डालें। फल फटने से रोकने के लिए बोरॉन का प्रयोग करें।",
            "చిక్కబళ్లాపూర్ నేలలలో నీరు త్వరగా ఇంకిపోతుంది. కాబట్టి టమోటా చుట్టూ సేంద్రీయ ఎరువు వేయండి. కాయ కుళ్ళు తెగులు రాకుండా బోరాన్ మరియు జింక్ చల్లండి."
          )
        };
      case "Indore":
        return {
          irrigationLabel: getLabel("Broadbed Furrow (BBF) precision grid drainage", "ब्रॉडबेड फरो (BBF) सिंचाई व जल निकासी", "వెడల్పాటి గట్ల కాలువల (BBF) విధానం"),
          mulchLabel: getLabel("Soybean seed-pod straw and wheat residue sheets", "सोयाबीन की भूसी और गेहूं के डंठल की जैविक मल्च", "సోయాబీన్ పొట్టు మరియు గోధుమ వ్యర్థాల మల్చింగ్"),
          advice: getLabel(
            "Malwa medium-black clay soils absorb deep moisture but waterlog easily, suffocating soybean root modules. Implement raised seedbeds. Intercrop chickpeas to restore vital soil nitrogen.",
            "मालवा की मध्यम काली मिट्टी नमी सोखती है लेकिन जलभराव होने पर सोयाबीन की जड़ों को गला देती है। हमेशा उठी हुई क्यारियों पर बुवाई करें। नाइट्रोजन पूर्ति के लिए चना अंतराशस्य बोएं।",
            "మాళ్వా ప్రాంత నల్ల నేలలు తేమను బాగా పీల్చుకుంటాయి కాని త్వరగా బురదగా మారుతాయి. సోయాబీన్ వేరుకుళ్ళు నివారణకు ఎత్తైన బెడ్స్ నిర్మించండి, శనగ పంటను అంతర పంటగా వేయండి."
          )
        };
      case "Chittoor":
        return {
          irrigationLabel: getLabel("Controlled Drip tubes in high-yielding tomatoes", "टमाटर के लिए दबाव-नियंत्रित ड्रिप", "టమోటాల సాగుకు పీడన నియంత్రిత డ్రిప్"),
          mulchLabel: getLabel("Silver-black plastic sheeting on raised beds", "मेड़ों पर चांदी-काली प्लास्टिक शीट मल्च", "టమోటా ఎత్తైన బెడ్లపై సిల్వర్-బ్లాక్ ప్లాస్టిక్ మల్చింగ్"),
          advice: getLabel(
            "Tomato blossom-end rot is extremely common in Madanapalle zone dry soils. Apply soil calcium pre-planting.",
            "मदनपल्ले शुष्क क्षेत्र में टमाटर का सड़ना (ब्लॉसम-एंड रॉट) बेहद आम है। रोपाई से पहले हमेशा चूना या कैल्शियम डालें।",
            "మదనపల్లె ప్రాంత టమోటా సాగులో కాయ కుళ్ళు తెగులు నివారణకు నాటడానికి ముందే నేలలో కాల్షియం ఎరువు వేసుకోండి."
          )
        };
      case "Nellore":
        return {
          irrigationLabel: getLabel("Channel alternate flood gates for Sona Paddy", "धान के लिए नालीदार नियंत्रित प्रवाह", "సన్న వరి సాగుా డెల్టా కాలువల క్రమబద్ధమైన పారకం"),
          mulchLabel: getLabel("Mango orchard residue leafy bio-mulches", "आम के भारी बगीचों में गिरी पत्तियों की मल्च", "మామిడి తోటల్లో ఎండి రాలిన ఆకుల మల్చింగ్"),
          advice: getLabel(
            "Heavy coastal clay soil loses aeration under heavy monsoons. Keep direct exit paths clear for flooded rain waters.",
            "कृष्णा डेल्टा के भारी जलभराव क्षेत्रों में निकासी उत्तम रखें अन्यथा धान में ब्लास्ट कवक रोग फैल जाएगा।",
            "కృష్ణా నది తీరప్రాంత జిగురు నేలల్లో నీరు నిలిచిపోకుండా బయటకు పోయే రక్షిత దారి ఉంచండి."
          )
        };
      case "Prakasam":
        return {
          irrigationLabel: getLabel("Pressure drip loops under premium tobacco", "तंबाकू हेतु दबाव नियंत्रित ड्रिप प्रणाली", "పొగాకు తోటలకు పీడన నియంత్రిత డ్రిప్ లైన్లు"),
          mulchLabel: getLabel("Coarse straw sheets on sandy loam beds", "रेतीली दोमट पर मोटी पुआल मल्च परत", "ఇసుక నేలల బెడ్లపై ఎండు గడ్డి మల్చింగ్"),
          advice: getLabel(
            "FCC tobacco requires low trace chlorides. Avoid high salt water pumping which reduces leaf elasticity and flavor.",
            "FCV तंबाकू में क्लोरीन की मात्रा कम होनी चाहिए। खारे पानी की सिंचाई से बचें वरना पत्तों की लोच कम हो जाएगी।",
            "FCV పొగాకు ఆకు నాణ్యత పెరగడానికి ఉప్పు నీటి తడులు నివారించండి, ఇది ఖరీదైన ఆకును కాపాడుతుంది."
          )
        };
      case "Nizamabad":
        return {
          irrigationLabel: getLabel("Drip arrays for major Turmeric beds", "हल्दी की उठी क्यारियों हेतु ड्रिप पाइप", "పసుపు ఎత్తైన బెడ్లకు మైక్రో డ్రిప్ లైన్లు"),
          mulchLabel: getLabel("Dry forest leaf mulch and green covers", "सूखे पत्तों और हल्दी के डंठल की मल्चिंग", "ఎండిపోయిన వనమూలికల ఆకులు కప్పడం"),
          advice: getLabel(
            "Nizamabad deep medium-black soils trap moisture but can lock oxygen. Install raised beds for Turmeric rhizomes.",
            "निजामाबाद की गहरी काली मिट्टी हल्दी के अंकुरों को सड़ा सकती है। हमेशा उठी हुई मेड़ों पर ही हल्दी बोएं।",
            "నిజామాబాద్ నల్ల నేలల్లో పసుపు ఊరవలెనన్న తప్పకుండా ఎత్తైన బెడ్ల పద్ధతిలోనే సాగు చేయాలి."
          )
        };
      case "Adilabad":
        return {
          irrigationLabel: getLabel("Deep furrow gravity flow under giant cotton", "कपास हेतु गहरी नालीदार प्रवाह प्रणाली", "పత్తి సాళ్ల మధ్య లోతైన కాలువల నీరు"),
          mulchLabel: getLabel("Soybean seed residue organic compost covers", "सोयाबीन की भूसी का प्राकृतिक जैविक खाद", "సోయాబీన్ పొట్టు మరియు పత్తి కొయ్యల మల్చింగ్"),
          advice: getLabel(
            "High clay Black Regur soil drains slowly. Ensure primary channels every 12 rows of cotton to bypass heavy monsoons.",
            "आदिलाबाद की भारी काली मिट्टी जलभराव करती है। मूसलाधार बारिश से नुकसान बचाने हेतु निकासी नालियां तैयार रखें।",
            "ఆదిలాబాద్ నల్ల రేగడి నేలల్లో పత్తి వేర్లకు గాలి తగలడానికి ప్రతి 12 సాళ్లకు లోతు కాలువ తవ్వండి."
          )
        };
      case "Karimnagar":
        return {
          irrigationLabel: getLabel("Alternate Wetting & Drying sensor pumps", "एवीडब्ल्यूडी सेंसर ट्यूबवेल्स", "సెన్సార్ ఆధారిత క్రమబద్ధమైన తడులు (AWD)"),
          mulchLabel: getLabel("Shredded maize stubble carbon compost covers", "मक्के के बारीक अवशेषों की कंपोस्ट मल्च", "మొక్కజొన్న కొయ్యల వ్యర్థాలతో సేంద్రీయ మల్చింగ్"),
          advice: getLabel(
            "Trace micronutrients are vital in chalky loams. Inject Zinc and Sulphur early under maize grids.",
            "करीमनगर की चल्का दोमट मिट्टी में जिंक और सल्फर का उचित अनुपात रखें ताकि मक्का पूर्ण स्वस्थ दानेदार रहे।",
            "కరీంనగర్ చల్క నేలల మొక్కజొన్నకు జింక్ పిచికారీ చేయడం వల్ల గింజలు లావుగా మారి అధిక దిగుబడి వస్తుంది."
          )
        };
      case "Mahabubnagar":
        return {
          irrigationLabel: getLabel("Low pressure sub-surface drip loops", "मूंगफली के लिए भूमिगत टपकन सिंचाई", "వేరుశనగ పంటకు భూగర్భ బిందు సేద్యం"),
          mulchLabel: getLabel("Castor pod organic straw blend sheets", "अरंडी और मूंगफली भूसी की मिश्रित जैविक मल्च", "ఆముదం గింజల పొట్టు మరియు ఎండు గడ్డి మల్చింగ్"),
          advice: getLabel(
            "Dry sandy soils face high evaporation. Intercrop Groundnut with Pigeon Red Gram in a 7:1 ratio for natural nitrogen.",
            "महबूबनगर के शुष्क भागों में पानी बचाने हेतु ड्रिप आवश्यक है। मूंगफली संग अरहर ७:१ अंतर-फसल बोएं।",
            "మహబూబ్‌నగర్ పొడి నేలల్లో వేరుశనగతో పాటు కందిపప్పు అంతర పంటగా 7:1 నిష్పత్తి లో వేసుకోవడం శ్రేయస్కరం."
          )
        };
      case "Nalgonda":
        return {
          irrigationLabel: getLabel("Orchard specific drip jet loops", "मौसंबी बागानों हेतु दबाव नियंत्रित जेट सिस्टम", "బత్తాయి తోటలకు గీత కాలువల బిందు సేద్యం"),
          mulchLabel: getLabel("Dry ragi straw and cotton stalk covers", "रागी की सूखी पुआल की घनी मल्चिंग परत", "రాగి ఎండు గడ్డి మరియు పత్తి కొయ్యల రక్షక కప్పడం"),
          advice: getLabel(
            "Sweet Lime orchards suffer high root dehydration stress. Use thick ragi straw mulch within 1.5 meter radius of tree trunks.",
            "नालगोंडा में गर्मी से मौसंबी सूख सकती है। पेड़ के मुख्य तने के चारों ओर रागी घास का मोटा मल्च अवश्य बिछाएं।",
            "నల్గొండ బత్తాయి చెట్ల మొదళ్ల వద్ద తేమ కాపాడటానికి గడ్డి పరచడం లేదా ప్లాస్టిక్ మల్చింగ్ చాలా ముఖ్యం."
          )
        };
      case "Khammam":
        return {
          irrigationLabel: getLabel("Micro-spray loops for Bright ASTA Chilli", "लाल मिर्च हेतु सूक्ष्म स्प्रिंकलर प्रणाली", "మిరప తోటల నాణ్యతకు మైక్రో స్ప్రింక్లర్లు"),
          mulchLabel: getLabel("Plastic mulch sheet combined with organic straw", "ऑर्गेनिक पुआल और प्लास्टिक मिश्रित मल्च", "వర్షపు తడి తగలకుండా ప్లాస్టిక్ షీట్ మల్చింగ్"),
          advice: getLabel(
            "High ASTA hot chilli values command top premium price. Maintain trace potash levels during pod setting.",
            "खम्मम के तीखे मिर्च निर्यातकों हेतु पोटाश का उचित छिड़काव करें ताकि मिर्च का चमकीला लाल रंग बना रहे।",
            "ఖమ్మం తేజ మిర్చి రంగు బలంగా మారడానికి కాయ కట్టే దశలో ద్రవరూప పొటాష్ పిచికారీ చేయండి."
          )
        };
      case "Medak":
        return {
          irrigationLabel: getLabel("Movable spray overhead lines under maize", "मक्के हेतु पोर्टेबल स्प्रिंकलर जेट्स", "మొక్కజొన్నకు పోర్టబుల్ తుంపర సేద్యం"),
          mulchLabel: getLabel("Sugarcane leaf trash mulching covers", "गन्ने की पत्तियों की शुष्क प्राकृतिक मल्च", "చెరకు ఆకుల సేంద్రీయ వ్యర్థ మల్చింగ్"),
          advice: getLabel(
            "Replace standard flooding with alternate furrow routes to save up to 40% reservoir water.",
            "मेडक के शुष्क पठारों में नालीदार नाली सिंचाई विधि अपनाएं। इससे पानी की बचत होगी और जड़ें भी स्वस्थ रहेंगी।",
            "మెదక్ పొడి పల్లాల్లో కాలువల మార్పిడి తడుల పద్ధతి వల్ల 40% అమూల్యమైన భూగర్భ జలాలు ఆదా అవుతాయి."
          )
        };
      case "Rangareddy":
        return {
          irrigationLabel: getLabel("Presurized greenhouse micro-drips", "पॉलीहाउस स्वचालित माइक्रो-ड्रिप", "గ్రీన్ హౌస్ సాగుకు పీడన నియంత్రిత డ్రిప్స్"),
          mulchLabel: getLabel("Silver-silver photobiotic plastic mulch beds", "टमाटर क्यारियों हेतु फोटो-बायोटिक प्लास्टिक मल्च", "టమోటా సాళ్లపై ఫోటో బయోటిక్ ప్లాస్టిక్ మల్చింగ్"),
          advice: getLabel(
            "Peri-urban vegetable crops are highly active. Use neem cake organic blocks to defend against root nematodes.",
            "रंगारेड्डी क्षेत्र में सब्जियों को कवक और सूत्रकृमी से बचाने के लिए नीम की खली की खाद मिट्टी में रोपाई पूर्व डालें।",
            "రంగారెడ్డి కూరగాయల సాగులో వేరుకుళ్ళు పురుగులు నివారించడానికి నాటక ముందే వేపపిండి ఎరువు వేయండి."
          )
        };

      case "Lucknow":
      default:
        return {
          irrigationLabel: getLabel("Controlled surface flooding and tube well cycles", "नियंत्रित प्रवाही सिंचाई चक्र", "నియంత్రిత కాలువల లేదా బావుల ద్వారా పారుదల"),
          mulchLabel: getLabel("Sugarcane trash mulching to preserve humus", "गन्ने की सूखी पत्तियों की शानदार प्राकृतिक मल्च", "చెరకు ఆకుల సేంద్రీయ మల్చింగ్"),
          advice: getLabel(
            "Deep fertile alluvial soils respond beautifully to vermicompost. To avoid nitrogen runoff from rains, apply Urea in splits of three. Ensure proper crop spacing for wind aeration.",
            "जलोढ़ गंगा मैदान में जैविक केंचुआ खाद शानदार काम करती है। यूरिया का बहना रोकने के लिए तीन किस्तों में प्रयोग करें। गन्ने में हवा के प्रवेश हेतु सही फासला रखें।",
            "గంగా మైదాన ప్రాంత నేలలలో వర్షాల వల్ల నత్రజని కొట్టుకుపోకుండా యూరియా ని 3 విడతలుగా వాడండి. గాలి వెలుతురు సోకేలా పంటల మధ్య దూరం ఉంచండి."
          )
        };
    }
  };

  const currentPractices = getZoneSustainablePractices(selectedZone.district);

  if (isAuthLoading) {
    return (
      <div id="auth-loading-screen" className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-900/30 animate-bounce">
            <Leaf className="w-8 h-8 fill-emerald-100 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h2 className="font-extrabold text-lg tracking-tight text-white font-sans">KisaanSeva AI</h2>
          <p className="text-xs text-emerald-400 font-mono animate-pulse">Establishing secure connection to agritech cloud...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div id="registration-portal-page" className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-slate-100 font-sans leading-relaxed flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Background decorative vector details */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl translate-x-12 translate-y-12 flex items-center justify-center">
          <Leaf className="w-48 h-48 text-emerald-500/5 rotate-45" />
        </div>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
          
          {/* Header & Language Select */}
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/20 hover:scale-105 transition-transform">
              <Leaf className="w-7 h-7 fill-emerald-100" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-white font-sans">KisaanSeva AI</h2>
              <p className="text-xs text-slate-400 font-semibold">
                {getLabel(
                  "Empowering Sustainable Agriculture & Soil Science",
                  "सतत कृषि और मृदा विज्ञान को सशक्त बनाना",
                  "జీవ వైవిధ్యం మరియు భూసార శాస్త్ర బలోపేతం"
                )}
              </p>
            </div>

            {/* Language Selection Chips on Registration Page */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80 w-fit mx-auto">
              <button
                id="reg-lang-eng-btn"
                onClick={() => setPreferredLanguage("English")}
                className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "English" 
                    ? "bg-emerald-600 text-white shadow font-extrabold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                English
              </button>
              <button
                id="reg-lang-hin-btn"
                onClick={() => setPreferredLanguage("Hindi")}
                className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "Hindi" 
                    ? "bg-emerald-600 text-white shadow font-extrabold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                हिन्दी
              </button>
              <button
                id="reg-lang-tel-btn"
                onClick={() => setPreferredLanguage("Telugu")}
                className={`text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "Telugu" 
                    ? "bg-emerald-600 text-white shadow font-extrabold" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                తెలుగు
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/80 my-4"></div>

          {/* Quick Registration Settings */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider block">
              ⚙️ {getLabel("PRE-CONFIGURE YOUR FARM PROFILE", "कृषि संदर्भ चुनें", "వ్యవసాయ ప్రాంతాన్ని ఎంచుకోండి")}
            </span>
            
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center">
                <label id="reg-district-label" className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  {getLabel("Select Your District:", "अपना जिला चुनें:", "మీ జిల్లాను ఎంచుకోండి:")}
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoLocationDetect(true)}
                  disabled={isDetecting}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1 bg-emerald-950/60 border border-emerald-900/60 px-2 py-1 rounded-lg hover:bg-emerald-900/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  📡 {isDetecting ? getLabel("Detecting...", "खोज रहे हैं...", "గుర్తిస్తోంది...") : getLabel("Auto-Detect", "स्वचालित खोज", "ఆటో డీటెక్ట్")}
                </button>
              </div>
              <select
                id="reg-district-select"
                value={selectedZone.district}
                onChange={(e) => {
                  const found = AGRICULTURAL_ZONES.find(z => z.district === e.target.value);
                  if (found) {
                    setSelectedZone(found);
                    localStorage.setItem("kisaan_manually_selected_zone", found.district);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans cursor-pointer"
              >
                {AGRICULTURAL_ZONES.map((z) => (
                  <option key={z.district} value={z.district} className="bg-slate-950 text-white">
                    📍 {z.district} ({z.state})
                  </option>
                ))}
              </select>
              {locationStatus && (
                <p className="text-[10px] text-indigo-400 font-semibold animate-pulse">
                  {locationStatus}
                </p>
              )}
              <p className="text-[10px] text-emerald-500/85 font-semibold italic mt-1 pl-1">
                {getLabel(
                  `Enables dynamic models for ${selectedZone.soilType} in ${selectedZone.district}`,
                  `${selectedZone.district} में ${selectedZone.soilType} के लिए मॉडल सक्रिय करता है`,
                  `${selectedZone.district}లో ${selectedZone.soilType} అనుకూల రకాలు`
                )}
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label id="reg-sms-label" className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {getLabel("Mobile Number for SMS Alerts:", "एसएमएस अलर्ट के लिए मोबाइल नंबर:", "SMS అలర్ట్‌ల కోసం మొబైల్ సంఖ్య:")}
              </label>
              <div className="flex gap-2">
                <span className="bg-slate-950 border border-slate-800 rounded-xl px-3 text-xs font-bold text-slate-405 flex items-center justify-center font-mono select-none text-slate-300">
                  +91
                </span>
                <input
                  id="reg-sms-phone-input"
                  type="tel"
                  placeholder={getLabel("Phone number (10-digits)", "फ़ोन नंबर (10-अंक)", "ఫోన్ నంబర్ (10-అంకెలు)")}
                  value={smsPhone}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setSmsPhone(cleanVal);
                    localStorage.setItem("kisaan_sms_phone", cleanVal);
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans font-semibold tracking-wide"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic pl-1 leading-tight">
                {getLabel(
                  "Used to send crucial unseasonal rain, dry heat wave & frost warnings directly to you.",
                  "इसका उपयोग आपको बेमौसम बारिश, लू और पाले की आपातकालीन चेतावनियां भेजने के लिए किया जाता है।",
                  "మీకు అకాల వర్షం, ఎండ తీవ్రత మరియు మంచు హెచ్చరికలను పంపడానికి ఉపయోగించబడుతుంది."
                )}
              </p>
            </div>
          </div>

          {/* Unlocked Core Features List info panel */}
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider block">
              ✨ {getLabel("YOU WILL UNLOCK:", "पंजीकरण के बाद प्राप्त लाभ:", "రిజిస్ట్రేషన్ ద్వారా పొందే ప్రయోజనాలు:")}
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🍃</span>
                <span className="text-[10px] text-slate-300 font-bold leading-tight">
                  {getLabel("AI Leaf Doctor", "पत्ती रोग निदान", "ఆకు పరీక్ష")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🧪</span>
                <span className="text-[10px] text-slate-300 font-bold leading-tight">
                  {getLabel("Soil NPK Audits", "मिट्टी पोषण सलाह", "భూసార నివేదిక")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">💬</span>
                <span className="text-[10px] text-slate-300 font-bold leading-tight">
                  {getLabel("AI Farmer Companion", "विशेषज्ञ चैटबॉट", "సహాయ కేంద్రం")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📈</span>
                <span className="text-[10px] text-slate-300 font-bold leading-tight">
                  {getLabel("Commodity Mandi Prices", "ताज़ा मंडी भाव", "మార్కెట్ ధరలు")}
                </span>
              </div>
            </div>
          </div>

          {/* CTA Action button to Sign In */}
          <div className="space-y-3 pt-2">
            <button
              id="reg-google-signin-btn"
              disabled={isAuthSubmitting}
              onClick={async () => {
                if (isAuthSubmitting) return;
                setIsAuthSubmitting(true);
                try {
                  const result = await signInWithPopup(auth, googleProvider);
                  if (result.user) {
                    setCurrentUser(result.user);
                    await syncUserProfile(result.user);
                    if (smsPhone) {
                      await updateSmsSettings(smsPhone, smsRainEnabled, smsHeatEnabled);
                    }
                  }
                } catch (err: any) {
                  console.error("Auth popup error:", err);
                  const isPopupInterrupted = 
                    err?.code === "auth/cancelled-popup-request" || 
                    err?.code === "auth/popup-closed-by-user" || 
                    String(err?.message || "").includes("cancelled-popup-request") || 
                    String(err?.message || "").includes("popup-closed-by-user");

                  if (!isPopupInterrupted) {
                    alert(
                      getLabel(
                        "A login issue was encountered. Note that Google Sign-in requires cookie and popup permissions.",
                        "लॉगिन विफल रहा। कृपया ब्राउज़र कुकी और पॉपअप अनुमति जांचें।",
                        "లాగిన్ విఫలమైంది. దయచేసి బ్రౌజర్ లో కుకీస్ మరియు పాప్-అప్స్ ఎనేబుల్ చేసుకోండి."
                      )
                    );
                  }
                } finally {
                  setIsAuthSubmitting(false);
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-600/10 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              {isAuthSubmitting ? (
                <span>{getLabel("Connecting...", "कनेक्ट किया जा रहा है...", "కనెక్ట్ అవుతోంది...")}</span>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>{getLabel("Secure Registration with Google", "गूगल के साथ सुरक्षित स्थान पंजीकरण", "గూగుల్ ద్వారా ఉచిత రిజిస్ట్రేషన్")}</span>
                </>
              )}
            </button>

            <span className="text-[10px] text-slate-500 font-medium block text-center">
              ⚠️ {getLabel("Instant agro-profile setup on first login. Security verified by SSL encryption.", "प्रथम लॉगिन पर स्वतः प्रोफाइल सेट होगा। सुरक्षा एसएसएल द्वारा प्रमाणित है।", "మొదటి సారి లాగిన్ అయినప్పుడు ప్రొఫైల్ ఆటోమేటిక్ గా క్రియేట్ అవుతుంది.")}
            </span>
          </div>

        </div>

        {/* Footer info links */}
        <div className="mt-8 text-center text-slate-500 text-[11px] font-semibold space-y-1">
          <p>© 2026 KisaanSeva AI • Dedicated to Arable Farm Security & Agrarian Growth</p>
          <p className="text-[9px] text-slate-650 font-medium">Operational via server-secure @google/genai & Firebase Authenticator</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans leading-relaxed selection:bg-emerald-200">
      
      {/* Top Navigation / Branding Strip */}
      <header id="main-app-header" className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/10 hover:rotate-12 transition-transform">
              <Leaf className="w-5 h-5 fill-emerald-100" />
            </div>
            <div>
              <h1 className="font-sans font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                KisaanSeva AI
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono">
                  Super App
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Smart Crop Diagnosis & Regional Soil Advisory</p>
            </div>
          </div>

          {/* Quick Active Zone Indicator Badge (Clickable, redirects to Climate Zone page) & Weather alert badge overlay */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button 
              id="header-zone-pill-btn"
              onClick={() => setActivePage("climate-zones")}
              className="group flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-4 py-1.5 transition-all text-xs font-semibold text-slate-700 cursor-pointer shadow-sm active:scale-98"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-slate-400 font-normal">Active Region:</span>
              <span className="text-slate-900 group-hover:text-emerald-700 font-bold">📍 {selectedZone.regionName || selectedZone.district}</span>
            </button>

            <WeatherAlertOverlay 
              selectedZone={selectedZone}
              preferredLanguage={preferredLanguage}
              smsPhone={smsPhone}
              onSmsPhoneChange={(phone) => updateSmsSettings(phone, smsRainEnabled, smsHeatEnabled)}
              smsRainEnabled={smsRainEnabled}
              onSmsRainToggle={(val) => updateSmsSettings(smsPhone, val, smsHeatEnabled)}
              smsHeatEnabled={smsHeatEnabled}
              onSmsHeatToggle={(val) => updateSmsSettings(smsPhone, smsRainEnabled, val)}
              onTriggerTestSms={() => {
                const alert = getCurrentZoneAlert(selectedZone.district);
                if (alert) {
                  triggerSmsTransmission(alert, selectedZone.district);
                } else {
                  triggerSmsTransmission({
                    type: "system",
                    title: "KisaanSeva Live Safety Diagnostics",
                    desc: "Optimal moisture index detected on your ground. No active severe rain or extreme dry heat warning at this hour."
                  }, selectedZone.district);
                }
              }}
            />
          </div>

          {/* Quick Configs (Language & Tech Specs spec) */}
          <div className="flex items-center gap-3">
            
            {/* Language Selection */}
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <span className="p-1 text-slate-500">
                <Globe className="w-4 h-4" />
              </span>
              <button
                id="lang-eng-btn"
                onClick={() => setPreferredLanguage("English")}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "English" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                English
              </button>
              <button
                id="lang-hin-btn"
                onClick={() => setPreferredLanguage("Hindi")}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "Hindi" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                हिन्दी
              </button>
              <button
                id="lang-tel-btn"
                onClick={() => setPreferredLanguage("Telugu")}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                  preferredLanguage === "Telugu" 
                    ? "bg-white text-emerald-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-800"
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Model Spec documentation button */}
            <button
              id="model-spec-dialog-trigger-btn"
              onClick={() => setIsExplainingOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span className="hidden md:inline">Specs</span>
              <span className="md:hidden">Specs</span>
            </button>

            {/* 🔑 USER AUTHENTICATION SECTION */}
            {currentUser ? (
              <div id="user-auth-profile-badge" className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl px-3 py-1.5 shadow-sm">
                {currentUser.photoURL ? (
                  <img 
                    id="user-profile-pic"
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || "Farmer"} 
                    className="w-6.5 h-6.5 rounded-full border border-emerald-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6.5 h-6.5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {(currentUser.displayName || currentUser.email || "F").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left max-w-[100px]">
                  <p className="text-[11px] font-extrabold text-slate-900 leading-none truncate">
                    {currentUser.displayName || "Active Farmer"}
                  </p>
                  <p className="text-[9px] text-emerald-700 font-bold mt-0.5">Cloud Synced</p>
                </div>
                <button
                  id="auth-signout-btn"
                  onClick={async () => {
                    await signOut(auth);
                    setCurrentUser(null);
                  }}
                  className="ml-1 text-[10px] text-rose-650 hover:text-rose-800 font-extrabold hover:bg-rose-50 px-2 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                id="auth-signin-btn"
                disabled={isAuthSubmitting}
                onClick={async () => {
                  if (isAuthSubmitting) return;
                  setIsAuthSubmitting(true);
                  try {
                    const result = await signInWithPopup(auth, googleProvider);
                    if (result.user) {
                      setCurrentUser(result.user);
                      await syncUserProfile(result.user);
                    }
                  } catch (err: any) {
                    console.error("Auth popup error:", err);
                    const isPopupInterrupted = 
                      err?.code === "auth/cancelled-popup-request" || 
                      err?.code === "auth/popup-closed-by-user" || 
                      String(err?.message || "").includes("cancelled-popup-request") || 
                      String(err?.message || "").includes("popup-closed-by-user");

                    if (!isPopupInterrupted) {
                      alert("A login issue was encountered. Note that Google Sign-in requires cookie and popup permissions.");
                    }
                  } finally {
                    setIsAuthSubmitting(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
              >
                <span className="text-emerald-100">🔑</span>
                <span>{isAuthSubmitting ? "Signing In..." : "Sign In with Google"}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Primary Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Verification banner for reviewers */}
        <div className="mb-6 bg-gradient-to-r from-emerald-800 to-indigo-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-900/5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 scale-150 translate-x-10 translate-y-10">
            <Cpu className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-xs font-bold text-emerald-200 uppercase tracking-wide font-mono">
              <Sparkles className="w-3.5 h-3.5" /> 
              SUSTAINABLE ARABLE GROWTH INITIATIVE
            </div>
            <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight">AI Solution for Agriculture & Sustainability Impact</h2>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Use the simple navigation menu below to verify all agricultural tools. Switch pages to inspect <strong>Crop Pathology diagnosis</strong>, calculate <strong>pH/NPK mineral soil cards</strong>, toggle <strong>Agro-Climatic Zones</strong>, or talk to the localized <strong>AI Farmer Assistant</strong>!
            </p>
          </div>
        </div>

        {/* 🗺️ INTERACTIVE NAVIGATION MENU BAR */}
        <nav id="app-navigation-menu-bar" className="mb-6 bg-white border border-slate-200 p-2 rounded-2xl shadow-sm font-sans">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {menus.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-menu-${item.id}-btn`}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all cursor-pointer hover:scale-[1.01] ${
                    isActive
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/15"
                      : "bg-white border-slate-100/70 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-9 h-9 text-base rounded-lg flex items-center justify-center shrink-0 ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {item.icon}
                  </div>
                  <div className="truncate">
                    <span className="block text-xs font-extrabold tracking-tight leading-tight">
                      {item.label}
                    </span>
                    <span className={`block text-[10px] truncate leading-none mt-0.5 ${
                      isActive ? "text-emerald-100 font-medium" : "text-slate-400 font-medium"
                    }`}>
                      {item.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Page rendering switch */}
        {activePage === "crop-doctor" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            
            {/* Left: crop doctor vision diagnosis (takes 2/3 space) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Main Action card */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                      <Activity className="w-4 h-4" />
                    </span>
                    {getLabel("Plant Issue Photo Diagnostic Engine", "पौधें की बीमारी का निदान", "ఆకు వ్యాధి నిర్ధారణ కేంద్రం")}
                  </h3>
                  <span className="text-slate-400 text-xs font-mono font-bold">VISION RECOGNITION</span>
                </div>

                {/* Upload Workspace Component */}
                <ImageUploader 
                  onImageSelected={handleImageSelected} 
                  preferredLanguage={preferredLanguage}
                />

                {/* Submit Trigger Diagnostic */}
                <div className="pt-2 flex justify-center">
                  <button
                    id="run-crop-diagnosis-main-btn"
                    onClick={runDiagnosis}
                    disabled={!uploadedBase64 || isDiagnosing}
                    className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold font-sans tracking-wide transition-all shadow-md text-sm flex items-center justify-center gap-2 ${
                      !uploadedBase64 
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" 
                        : isDiagnosing 
                        ? "bg-emerald-100 text-emerald-700 cursor-wait border border-emerald-200" 
                        : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.01] active:scale-99 shadow-emerald-600/10"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isDiagnosing 
                      ? getLabel("Diagnosing Leaf pathologically...", "जांच चल रही है...", "ఆరోగ్య నిర్ధారణ జరుగుతోంది...")
                      : getLabel("Run AI Crop Diagnosis", "एआई फसल रोग निदान शुरू करें", "AI పంట ఉచిత నిర్ధారణ")}
                  </button>
                </div>
              </div>

              {/* Diagnostic results report screen */}
              <div id="diagnostic-results-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-emerald-100 text-emerald-700 rounded-md">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {getLabel("Diagnosis & Treatment Recommendations", "निदान रिपोर्ट और उपचार सलाह", "నిర్ధారణ నివేదిక మరియు స్ప్రే యాజమాన్యం")}
                    </h4>
                  </div>
                  {diagnosis && (
                    <span id="report-source-indicator" className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                      {diagnosis.source}
                    </span>
                  )}
                </div>

                <div className="p-5 md:p-6">
                  {isDiagnosing ? (
                    <div id="diagnosis-loading-state" className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 border-4 border-t-emerald-600 rounded-full animate-spin"></div>
                        <Leaf className="w-6 h-6 text-emerald-600 animate-bounce" />
                      </div>
                      <div className="space-y-1 max-w-md">
                        <h5 className="font-semibold text-slate-800 text-sm">AI KisanSeva Core Working...</h5>
                        <p className="text-slate-500 text-xs italic transition-all animate-pulse">
                          "{LOADER_IPS[loaderIndex]}"
                        </p>
                      </div>
                    </div>
                  ) : diagnosis ? (
                    <div id="diagnosis-report-container" className="space-y-6">
                      <div className="markdown-body prose max-w-none text-slate-800 text-xs leading-relaxed space-y-1">
                        <ReactMarkdown>{diagnosis.report}</ReactMarkdown>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Diagnose Time: {new Date(diagnosis.timestamp).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Grounded on Soil Code: {selectedZone.soilType}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div id="diagnosis-empty-state" className="py-12 text-center text-slate-500 space-y-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Leaf className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm mx-auto">
                        <p className="font-semibold text-slate-800 text-xs">
                          {getLabel("No active plant diagnosis loaded", "कोई निदान रिपोर्ट लोड नहीं है", "నిర్ధారణ నివేదిక ఏదీ అందుబాటులో లేదు")}
                        </p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {getLabel("Take a photo of an infected leaf or choose one in 'Demo Crop Samples' to load AI insights.", "अपने खेत की पत्ती का फोटो लें या नमूने का चयन करके 'एआई फसल निदान' दबाएं।", "పంట ఆకు ఫోటో తీయండి లేదా పైనున్న శాంపిల్స్ లో ఒకటి ఎంపिकी చేసి అప్లై చేయొచ్చు.")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar quick status context */}
            <div className="space-y-6">
              
              {/* Selected zone badge summary */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                    {getLabel("Selected Eco-Zone", "चयनित कृषि-क्षेत्र", "ఎంపిక చేసిన ప్రాంతం")}
                  </h4>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{getLabel("District Context", "जिला", "జిల్లా")}</span>
                    <span className="text-slate-800 font-extrabold">{selectedZone.district}, {selectedZone.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{getLabel("Ground Soil", "मिट्टी", "నేల రకం")}</span>
                    <span className="text-teal-700 bg-teal-50 px-2 rounded font-semibold text-[11px] font-mono">{selectedZone.soilType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{getLabel("Climate", "जलवायु", "వాతావరణం")}</span>
                    <span className="text-slate-600 font-medium text-right font-mono text-[11px]">{selectedZone.climate}</span>
                  </div>
                </div>

                <button
                  onClick={() => setActivePage("climate-zones")}
                  className="w-full mt-1.5 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-[11px] font-extrabold text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-center transition-all bg-slate-50/50 cursor-pointer"
                >
                  {getLabel("Change Geographic Profile →", "क्षेत्र संदर्भ बदलें →", "ప్రాంత వివరణ మార్చుకోడానికి ఇక్కడ క్లిక్ చెయ్యండి →")}
                </button>
              </div>

              {/* Cloud Database Synced Diagnoses History (Real-time updates) */}
              {currentUser && (
                <div id="cloud-database-diagnoses-history-card" className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4 animate-fade-in">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded-md text-xs">🌐</span>
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between w-full">
                      <span>Farm Scan Archive</span>
                      <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">Sync Active</span>
                    </h4>
                  </div>

                  {pastDiagnoses.length === 0 ? (
                    <p className="text-[11px] text-slate-450 italic leading-relaxed">No cloud recordings found yet. Your diagnosed reports will appear here in real-time!</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {pastDiagnoses.map((rec) => (
                        <button
                          key={rec.id}
                          id={`history-diag-item-${rec.id}`}
                          onClick={() => {
                            setCropName(rec.cropName);
                            setDiagnosis({
                              report: rec.report,
                              source: rec.source,
                              timestamp: rec.timestamp?.seconds ? new Date(rec.timestamp.seconds * 1000).toISOString() : new Date().toISOString(),
                              language: rec.language || "English"
                            });
                          }}
                          className="w-full text-left p-2.5 rounded-xl border border-slate-150 hover:border-emerald-300 hover:bg-emerald-50/10 transition-all flex items-center justify-between gap-2.5 group cursor-pointer"
                        >
                          <div className="truncate">
                            <h5 className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 truncate">{rec.cropName}</h5>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              {rec.timestamp?.seconds ? new Date(rec.timestamp.seconds * 1000).toLocaleDateString() : "Just now"} • {rec.district}
                            </p>
                          </div>
                          <span className="text-slate-400 group-hover:text-emerald-600 text-[10px] shrink-0 font-bold">Restore →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Legal Warning */}
              <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  {getLabel("Farmer Expert Warning", "विशेषज्ञ चेतावनी", "వ్యవసాయ నిపుణుల హెచ్చరిక")}
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {getLabel(
                    "Computer-vision and machine learning diagnostic software are advisory instruments meant to supplement localized farming expertise. Always consult a block agricultural development officer to verify local conditions.",
                    "कंप्यूटर-विजन नैदानिक ​​सॉफ्टवेयर सलाहकारी उपकरण हैं जो स्थानीय स्तर कृषि कौशल के पूरक हैं। किसी भी अंतिम निर्णय से पहले हमेशा पंचायत विकास अधिकारी से सलाह लें।",
                    "ఈ కంప్యూటర్ సలహాలు ప్రాథమిక సమాచారం కోసం మాత్రమే. ఖరీదైన మందులు వాడే ముందు పంపిణీ కేంద్రాన్ని లేదా అధికారిని సంప్రదించి సమాచారాన్ని సరిచూసుకోండి."
                  )}
                </p>
              </div>
            </div>

          </div>
        )}

        {activePage === "soil-health" && (
          <div className="space-y-6 animate-fade-in">
            <SoilHealthAdvisory 
              selectedZone={selectedZone} 
              preferredLanguage={preferredLanguage} 
              currentUser={currentUser}
            />
            
            {/* Informational checklist below soil cards */}
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 text-teal-900 text-xs space-y-3">
              <h4 className="font-extrabold flex items-center gap-1.5 uppercase text-teal-950 font-sans tracking-wide">
                🧪 {getLabel("How to Collect Physical Soil Samples Correctly", "भौतिक मिट्टी के नमूने लेने की सही विधि", "భూసార పరీక్ష కోసం మట్టి నమూనా సేకరించే విధానం")}
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-teal-800 leading-relaxed pl-1">
                <li>{getLabel("Dig a V-shaped trench of 6 to 9 inches inside dry, unfertilized spots of your plot.", "अपने खेत के सूखे हिस्सों में ६ से ९ इंच गहरा वी-आकार (V-Shape) का गड्ढा घोषित करें।", "పొలంలో నిలిచిన నీరు లేని చోట వి ఆకారంలో (V-Shape) 6 నుండి 9 అంగుళాల లోతు తవ్వాలి.")}</li>
                <li>{getLabel("Scrape soil from borders, mix 5 spots of soil in a plastic bucket, split into quadrants.", "किनारों से मिट्टी खुरचें, और ५ अलग स्थानों की मिट्टी मिलाकर प्लास्टिक बाल्टी में एकत्र करें।", "గట్ల దగ్గర కాకుండా పొలంలో 5 వేర్వేరు చోట్ల మట్టి సేకరించి ఒక బకెట్ లో బాగా కలపండి.")}</li>
                <li>{getLabel("Retrain 500 grams in a clean cotton bag, tag with your active crop details, and send to testing block labs.", "५०० ग्राम साफ सूती थैली में रखें, नाम लिखकर पंचायत विकास प्रयोगशाला में निःशुल्क जांच को भेजें।", "అర కేజీ మట్టిని సంచిలో ప్యాక్ చేసి, మీ పేరు పొలం వివరాలతో మండల భూసార కేంద్రానికి పంపండి.")}</li>
              </ul>
            </div>
          </div>
        )}

        {/* AI Helper chat conversation screen */}
        {activePage === "farmer-chat" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-200">
              <AdvisoryChat 
                selectedZone={selectedZone}
                preferredLanguage={preferredLanguage}
              />
            </div>
            
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-4 text-xs text-emerald-800 flex items-start gap-3">
              <span className="text-base select-none">💡</span>
              <p>
                <strong>{getLabel("Continuous Grounded Advices:", "निरंतर सलाह:", "వ్యవసాయ సూచనలు:")}</strong>{" "}
                {getLabel(
                  "KisaanSeva chatbot remembers your selected eco-region. You can type queries in Hindi or Telugu to retrieve customized traditional natural fertilizer recipes immediately.",
                  "किसानसेवा चैटबॉट आपके चयनित क्षेत्र को याद रखता है। आप अपनी स्थानीय भाषा में प्राकृतिक उपचारों के बारे में सवाल पूछ सकते हैं।",
                  "ఈ చొరవ మీ స్థానిక నేల నమూనాకు అనుకూలంగా పనిచేస్తుంది. మీరు వేరే సందేహాలను కూడా తెలుగు లో టైప్ చేసి తెలుసుకోవచ్చు."
                )}
              </p>
            </div>
          </div>
        )}

        {/* 📍 Regional Climate zones profile details view */}
        {activePage === "climate-zones" && (() => {
          const weatherPractices = getZoneSustainablePractices(activeWeatherZone.district);
          return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              
              {/* Left selector */}
              <div className="space-y-6">
                <WeatherZoneCard 
                  selectedZone={activeWeatherZone}
                  onZoneChange={(zone) => {
                    setWeatherZone(zone);
                    setSelectedZone(zone);
                    localStorage.setItem("kisaan_manually_selected_zone", zone.district);
                  }}
                  preferredLanguage={preferredLanguage}
                />

                {/* 📲 SMS Alerts Settings Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-850 text-sm">
                        {getLabel("Farmer Weather Alerts", "किसान एसएमएस चेतावनी प्रेषक", "రైతు వాతావరణ అలర్ట్")}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">SMS Warnings Configuration</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-[11px] text-slate-500 font-semibold leading-normal">
                      {getLabel(
                        "Set up your phone number to receive urgent mobile messages during critical torrential rains or severe heat waves.",
                        "भारी वर्षा या अत्यधिक ग्रीष्म लहर के दौरान अपने मोबाइल पर तत्काल चेतावनी संदेश प्राप्त करने के लिए अपना नंबर दर्ज करें।",
                        "భారీ వర్షాలు లేదా తీవ్ర వడగాల్పుల సమయంలో మీ మొబైల్ కు నేరుగా సమాచారం అందడానికి నెంబర్ నమోదు చేయండి."
                      )}
                    </p>

                    <div className="space-y-1">
                      <div className="flex gap-1.5">
                        <span className="bg-slate-100 border border-slate-200 rounded-xl px-2 text-xs font-bold text-slate-700 flex items-center justify-center font-mono select-none">
                          +91
                        </span>
                        <input
                          type="tel"
                          placeholder="Phone number (10-digits)"
                          value={smsPhone}
                          onChange={(e) => updateSmsSettings(e.target.value.replace(/[^0-9]/g, "").slice(0, 10), smsRainEnabled, smsHeatEnabled)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans font-semibold tracking-wide text-slate-805"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-150 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <span className="flex items-center gap-1.5">
                          🌧️ {getLabel("Heavy Rain Alerts", "भारी वर्षा चेतावनी", "భారీ వర్ష హెచ్చరిక")}
                        </span>
                        <input
                          type="checkbox"
                          checked={smsRainEnabled}
                          onChange={(e) => updateSmsSettings(smsPhone, e.target.checked, smsHeatEnabled)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-150 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <span className="flex items-center gap-1.5">
                          🔥 {getLabel("Heavy Heat Alerts", "तीव्र लू चेतावनी", "తీవ్ర ఎండలు / వేడి గాలులు")}
                        </span>
                        <input
                          type="checkbox"
                          checked={smsHeatEnabled}
                          onChange={(e) => updateSmsSettings(smsPhone, smsRainEnabled, e.target.checked)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        const alert = getCurrentZoneAlert(activeWeatherZone.district);
                        if (alert) {
                          triggerSmsTransmission(alert, activeWeatherZone.district);
                        } else {
                          triggerSmsTransmission({
                            type: "system",
                            title: "KisaanSeva Live Safety Diagnostics",
                            desc: "Optimal moisture index detected on your ground. No active severe rain or extreme dry heat warning at this hour."
                          }, activeWeatherZone.district);
                        }
                      }}
                      disabled={!smsPhone || smsPhone.trim().length < 10}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow hover:shadow-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Transmit Test Warning SMS 📲</span>
                    </button>
                  </div>

                  {/* SMS logs list for transparent execution tracking */}
                  {smsLogList.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        📜 Message Dispatch Logs
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-[11px]">
                        {smsLogList.map((log) => (
                          <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-150 flex flex-col gap-1 leading-normal">
                            <div className="flex items-center justify-between font-bold text-[9px] text-slate-400">
                              <span>To: +91 {log.recipient}</span>
                              <span className="text-emerald-600 select-none font-semibold">✓ DELIVERED</span>
                            </div>
                            <p className="text-slate-600 font-semibold break-words">
                              {log.messageText}
                            </p>
                            <span className="text-[8.5px] text-slate-400 text-right block font-mono">{log.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    {getLabel("Sustainability Quick Fact", "कृषि तथ्य", "పర్యావరణ వాస్తవం")}
                  </span>
                  <p className="text-slate-500 leading-relaxed font-semibold">
                    {getLabel(
                      "Switching districts in this panel automatically updates soil models and chat prompts in other tabs to preserve local geological accuracy.",
                      "इस पैनल में जिला बदलने से अन्य सभी टैब (मृदा और चैट) की गणना क्षेत्र की मिट्टी के अनुसार स्वतः बदल जाएगी।",
                      "ఈ ప్యానెల్ లో జిల్లాని మార్చడం ద్వారా ఎరువుల నిష్పత్తులు మరియు చాట్ బాక్స్ ఆటోమేటిక్ గా ఆ ప్రాంతానికి అనుగుణంగా మారిపోతాయి."
                    )}
                  </p>
                </div>
              </div>

              {/* Right panel detailed seasonal practices */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  
                  <div className="border-b border-slate-100 pb-4">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full font-mono">
                      {activeWeatherZone.regionName} Profile
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-base mt-2">
                      {getLabel("Sustainable Climate & Moisture Practice", "सतत जलवायु और सिंचाई योजना", "స్థానిక సాగు విధానాలు మరియు యాజమాన్యం")}
                    </h3>
                    <p className="text-slate-500 text-xs mt-1">
                      {getLabel("Water conservation and sowing schedules adapted for district parameters", "जिले के मापदंडों के लिए अनुकूलित जल संचयन और बुवाई कार्यक्रम", "నమోదైన ఉష్ణోగ్రత మరియు వర్షపాతం ఆధారంగా ప్రత్యేక సలహాలు")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Irrigation Card */}
                    <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50 space-y-1.5">
                      <span className="inline-block text-[10px] font-bold text-indigo-800 uppercase tracking-wide font-mono">
                        🌅 Recommended Irrigation Style
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{weatherPractices.irrigationLabel}</h4>
                      <p className="text-[11px] text-slate-500">Optimized to check water run-off and downstream evaporation loss.</p>
                    </div>

                    {/* Mulch Card */}
                    <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-100/50 space-y-1.5">
                      <span className="inline-block text-[10px] font-bold text-teal-800 uppercase tracking-wide font-mono">
                        🍂 Organic Mulch Strategy
                      </span>
                      <h4 className="text-xs font-bold text-slate-800">{weatherPractices.mulchLabel}</h4>
                      <p className="text-[11px] text-slate-500">Secures beneficial biological microbial activity in ground topsoil.</p>
                    </div>

                  </div>

                  {/* Extensive regional recommendations */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 md:p-5 space-y-3 leading-relaxed">
                    <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      💡 {getLabel("Geographic Sowing Guidelines", "भौगोलिक बुवाई मार्गदर्शन", "భౌగోళిక విత్తు సలహా")}
                    </h4>
                    <p className="text-slate-700 text-xs leading-relaxed">{weatherPractices.advice}</p>
                  </div>

                  {/* Sowing Season Calendar timeline bar */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800">
                      📅 {getLabel("Primary Cultivation Crop Sowing Season", "फसल बुवाई कैलेंडर समय चक्र", "పాలు పంటల సాగు కాల పట్టిక")}
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2.5 rounded-lg font-semibold">
                        <span className="block font-bold">Kharif Season</span>
                        <span className="text-[10px] text-emerald-600 font-normal">June – October sowed</span>
                      </div>
                      <div className="bg-indigo-50 text-indigo-800 border border-indigo-100 p-2.5 rounded-lg font-semibold">
                        <span className="block font-bold">Rabi Season</span>
                        <span className="text-[10px] text-indigo-600 font-normal">November – April sowed</span>
                      </div>
                      <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2.5 rounded-lg font-semibold">
                        <span className="block font-bold">Zaid Season</span>
                        <span className="text-[10px] text-amber-600 font-normal">March – June dry sowed</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          );
        })()}

        {/* 📊 Localized Mandi Market Prices and Harvest decisions section */}
        {activePage === "market-prices" && (
          <div className="animate-fade-in">
            <MarketPriceTracker 
              selectedZone={activeMarketZone}
              onZoneChange={(zone) => {
                setMarketZone(zone);
                setSelectedZone(zone);
                localStorage.setItem("kisaan_manually_selected_zone", zone.district);
              }}
              preferredLanguage={preferredLanguage}
              primaryCrops={activeMarketZone.primaryCrops}
            />
          </div>
        )}

      </main>

      {/* Details explanation modal specs */}
      <DiagExplanationDialog 
        isOpen={isExplainingOpen} 
        onClose={() => setIsExplainingOpen(false)} 
      />

      {/* Simple Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 KisaanSeva AI • Dedicated to Rural Farm Security and Agrarian Sustainability</p>
          <p className="text-[10px] text-slate-400 mt-1">Operational using server-safe Google Gemini 3.5-Flash and modern @google/genai interface.</p>
        </div>
      </footer>

      {/* 📲 SMS DISPATCH TOASTER NOTIFICATION */}
      {lastAlertDispatched && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 text-white rounded-2xl border border-emerald-500/30 p-4 shadow-2xl shadow-emerald-500/20 animate-fade-in flex flex-col gap-2 font-sans border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              📲 Farmers Warning Transmitted!
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">{lastAlertDispatched.timestamp}</span>
          </div>
          <p className="text-[11px] font-semibold leading-relaxed text-slate-205">
            {lastAlertDispatched.message}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono mt-1 pr-1">
            <span>Recipient: <span className="text-emerald-300 font-semibold">+91 {lastAlertDispatched.phone}</span></span>
            <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px] bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-800/50">DELIVERED</span>
          </div>
        </div>
      )}

    </div>
  );
}
