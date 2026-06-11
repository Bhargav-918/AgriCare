import React, { useState, useEffect } from "react";
import { AgriculturalZone } from "../types";
import { AGRICULTURAL_ZONES } from "../samples";
import ReactMarkdown from "react-markdown";
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  TrendingUpDown, 
  Sparkles, 
  ChevronRight, 
  Scale, 
  AlertCircle,
  HelpCircle,
  Locate,
  MapPin
} from "lucide-react";

interface MarketPriceTrackerProps {
  selectedZone: AgriculturalZone;
  onZoneChange?: (zone: AgriculturalZone) => void;
  preferredLanguage: string;
  primaryCrops?: string[];
}

interface CropPriceData {
  cropName: string;
  localCropName: string;
  unit: string;
  currentPrice: number;
  priceChangePercent: number; // e.g. +4.2 or -1.5
  history4Weeks: number[]; // e.g. [6200, 6400, 6500, 6800]
  marketStatus: "bullish" | "stable" | "bearish";
  harvestAdvice: string;
  hindiHarvestAdvice: string;
  teluguHarvestAdvice: string;
}

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

export default function MarketPriceTracker({ selectedZone, onZoneChange, preferredLanguage, primaryCrops = [] }: MarketPriceTrackerProps) {
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);
  const [filterByPrimary, setFilterByPrimary] = useState<boolean>(true);
  const [newsReport, setNewsReport] = useState<string>("");
  const [newsSource, setNewsSource] = useState<string>("");
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  
  // Separate Market Geolocation states
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  const handleMandiZoneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = AGRICULTURAL_ZONES.find(z => z.district === e.target.value);
    if (found && onZoneChange) {
      onZoneChange(found);
    }
  };

  const handleDetectMarketLocation = () => {
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
        "Requesting GPS location access to find closest Mandi...",
        "निकटतम मंडी का पता लगाने के लिए जीपीएस स्थान का अनुरोध किया जा रहा है...",
        "సమీప మార్కెట్ యార్డ్‌ను కనుగొనడానికి GPS స్థానం కోసం అనుమతి అడుగుతోంది..."
      ),
      type: "info"
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setLocationStatus({
          text: getLabel(
            `GPS acquired. Finding nearest Mandi / market district (Lat: ${latitude.toFixed(3)}, Lng: ${longitude.toFixed(3)})...`,
            `जीपीएस प्राप्त हुआ। निकटतम मंडी/बाजार जिला का चयन किया जा रहा है...`,
            `GPS స్థానం గుర్తించబడింది. సమీప మార్కెట్ యార్డ్‌ను మ్యాచ్ చేస్తోంది...`
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
            { headers: { "User-Agent": "AI-Crop-Doctor-Mandi-Finder" } }
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

        // Apply selected zone back to market tracker callback
        if (onZoneChange) {
          onZoneChange({
            ...matchedZone,
            regionName: preciseLocalName ? preciseLocalName : `GPS Mandi (${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°)`
          });
        }
        
        setLocationStatus({
          text: getLabel(
            `🎯 Mandi Location: ${preciseLocalName || `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (Matched to ${matchedZone.district} Mandi)`,
            `🎯 मंडी स्थान: ${preciseLocalName || `जीपीएस (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (${matchedZone.district} मंडी से मिलाया गया)`,
            `🎯 మార్కెట్ స్థానం: ${preciseLocalName || `GPS (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`} (${matchedZone.district} మార్కెట్ మ్యాచ్ చేయబడింది)`
          ),
          type: "success"
        });

        setIsLoadingLocation(false);

        // Clear success notification after 5 seconds
        setTimeout(() => {
          setLocationStatus(null);
        }, 5000);
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

  useEffect(() => {
    const fetchMarketNews = async () => {
      setIsNewsLoading(true);
      try {
        const response = await fetch("/api/market-news", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            district: selectedZone.district,
            state: selectedZone.state,
            primaryCrops: primaryCrops,
            preferredLanguage: preferredLanguage
          })
        });
        if (response.ok) {
          const data = await response.json();
          setNewsReport(data.news);
          setNewsSource(data.source);
        } else {
          throw new Error("Failed to fetch market news");
        }
      } catch (err) {
        console.error("News fetching failed:", err);
        const mockNotice = isHindi 
          ? `### 📰 ${selectedZone.district} मंडी समाचार बुलेटिन\n*   **दामों की मजबूती**: प्रमुख खाद्य फसलों के स्थानीय मंडी में भरपूर उठान की उम्मीद है। `
          : `### 📰 ${selectedZone.district} Mandi Local News Bulletin\n*   **Processor Active Demand**: Strong direct buying from mills is active, holding stable margins for regional producers. Check MSP limits.`;
        setNewsReport(mockNotice);
        setNewsSource("Local offline backup feed");
      } finally {
        setIsNewsLoading(false);
      }
    };

    fetchMarketNews();
  }, [selectedZone, primaryCrops, preferredLanguage]);

  // Specialized mock market tracker metrics matching region & crop profile
  const getCropMarketData = (district: string): CropPriceData[] => {
    switch (district) {
      case "Anantapur":
        return [
          {
            cropName: "Groundnut (Pod)",
            localCropName: getLabel("मूंगफली (साबुत)", "मूंगफली (साबुत)", "వేరుశనగ (కాయలు)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 6850,
            priceChangePercent: 4.8,
            history4Weeks: [6300, 6500, 6620, 6850],
            marketStatus: "bullish",
            harvestAdvice: "High international export order is dry-pressing spot supplies. Harvest dry pods now and ship ahead of rain moistures.",
            hindiHarvestAdvice: "विदेशी निर्यात मांग से बाजार तेज है। गीले होने से पहले सूखी फलियां तुरंत निकालें और मंडी में सर्वोत्तम मूल्य पर बेचें।",
            teluguHarvestAdvice: "అంతర్జాతీయంగా మంచి డిమాండ్ ఉంది. వర్షాలకు ముందే వేరుశనగ కాయలను బాగా ఎండబెట్టి విక్రయించడం లాభదాయకం."
          },
          {
            cropName: "Paddy (Kurnool Sona)",
            localCropName: getLabel("धान (सोना)", "धान (सोना मन्तर)", "వరి (కర్నూలు సోనా)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2420,
            priceChangePercent: 1.2,
            history4Weeks: [2380, 2400, 2410, 2420],
            marketStatus: "stable",
            harvestAdvice: "Steady domestic food security purchase. Avoid middle-broker margins by delivering direct to Government Mandi centres.",
            hindiHarvestAdvice: "घरेलू खाद्य सुरक्षा खरीदारी स्थिर बनी हुई है। बिचौलियों से बचकर सीधे सरकारी न्यूनतम समर्थन मूल्य केंद्र पर फसल पहुंचाएं।",
            teluguHarvestAdvice: "స్థానిక మార్కెట్ స్థిరంగా ఉంది. దళారులను నమ్మి నష్టపోకుండా ప్రభుత్వ కొనుగోలు కేంద్రాల్లో విక్రయించండి."
          },
          {
            cropName: "Pomegranate (Kesar)",
            localCropName: getLabel("अनार (केसर)", "अनार (केसर)", "దానిమ్మ (కేసర్)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 11200,
            priceChangePercent: -2.5,
            history4Weeks: [11800, 11500, 11400, 11200],
            marketStatus: "bearish",
            harvestAdvice: "Southward supplies peaking at Mumbai ports is driving short-term price softness. Pick only heavy deep-red skin pods to get premium grade prices.",
            hindiHarvestAdvice: "स्थानीय फल आवक अधिक होने से दाम हल्के नरम हैं। केवल गहरे पके फलों की छंटाई कर ग्रेड-ए बाजार भेजें ताकि ऊंचा दाम प्राप्त हो।",
            teluguHarvestAdvice: "మార్కెట్లోకి దానిమ్మ పండ్ల వరద పెరగడం వల్ల ధరలు కాస్త తగ్గాయి. కేవలం ముదురు ఎరుపు రంగు పండ్లను ఏరి గ్రేడింగ్ చేసి పంపండి."
          }
        ];

      case "Nagpur":
        return [
          {
            cropName: "Cotton (Long Staple)",
            localCropName: getLabel("कपास (लंबा रेशा)", "कपास (लंबा रेशा)", "పత్తి (పొడుగు పింజ)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7850,
            priceChangePercent: 5.6,
            history4Weeks: [7200, 7450, 7600, 7850],
            marketStatus: "bullish",
            harvestAdvice: "Spinning mills across Gujarat are aggressive buyers. Harvest and protect picked bolls from damp moisture immediately.",
            hindiHarvestAdvice: "गुजरात की सूती मिलों से भारी मांग है। कपास की खुली गांठों को नमी वाली बारिश से पहले तुरन्त सुरक्षित भंडार गृह में रखें।",
            teluguHarvestAdvice: "గుజరాత్ మిల్లుల నుంచి పత్తికి భారీ డిమాండ్ ఉంది. వర్షాలకు పత్తి తడవకుండా జాగ్రత్తపడి మంచి ధరకు విక్రయించండి."
          },
          {
            cropName: "Soybean (Yellow)",
            localCropName: getLabel("सोयाबीन (पीला)", "सोयाबीन (पीला)", "సోయాబీన్ (పసుపు)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 4320,
            priceChangePercent: -1.4,
            history4Weeks: [4450, 4400, 4350, 4320],
            marketStatus: "bearish",
            harvestAdvice: "New season crops entering Madhya Pradesh are swelling supply chains. Sell standing holds quickly to clear storage space.",
            hindiHarvestAdvice: "मध्य प्रदेश की मंडियों में भारी आवक से दबाव है। भंडारित अनाज को धीरे-धीरे निकालकर तत्काल बिक्री को पूरा करें।",
            teluguHarvestAdvice: "పక్క రాష్ట్రాల నుంచి సోయాబీన్ మార్కెట్లోకి ఎక్కువగా రావడం వల్ల ధర కాస్త తగ్గింది. కావున నిలువ ఉన్న పాత పంటను విక్రయించండి."
          },
          {
            cropName: "Sweet Orange",
            localCropName: getLabel("संतरा (नागपुरी)", "संतरा (नागपुरी)", "కమలా పండు లేదా నారింజ"),
            unit: getLabel("Crate (20kg)", "क्रेट (२० किलो)", "క్రేట్ (20 కేజీలు)"),
            currentPrice: 950,
            priceChangePercent: 3.2,
            history4Weeks: [880, 910, 930, 950],
            marketStatus: "bullish",
            harvestAdvice: "Summer vitamin-C wellness demand is extremely strong in Delhi-NCR markets. Ship mature orange cases directly.",
            hindiHarvestAdvice: "दिल्ली और उत्तर भारत के फल बाजारों में भारी मांग है। पूरी तरह गोल मध्यम आकार के मीठे संतरे तुरंत छंटाई कर भेजें।",
            teluguHarvestAdvice: "ఉత్తర భారతదేశ మార్కెట్లలో మన నారింజ పండ్లకు భీభత్సమైన ప్రజాదరణ ఉంది. పండిన కాయలను వెంటనే కోసి రవాణా చేయండి."
          }
        ];

      case "Bhatinda":
        return [
          {
            cropName: "Kanak wheat (Sarbati)",
            localCropName: getLabel("गेहूं (सरबती)", "गेहूँ (शरबती)", "గోధుమలు (శర్బతి)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2475,
            priceChangePercent: 1.5,
            history4Weeks: [2420, 2440, 2450, 2475],
            marketStatus: "stable",
            harvestAdvice: "Procurement MSP centers are stable. Ensure moisture content is certified under 12% to secure maximum immediate payments.",
            hindiHarvestAdvice: "सरकारी खरीद केंद्रों की दरें बहुत मजबूत हैं। सुनिश्चित करें कि मंडी ले जाते समय अनाज में नमी १२% से कम हो ताकि त्वरित भुगतान हो सके।",
            teluguHarvestAdvice: "ప్రభుత్వ మద్దతు ధరల కేంద్రాలు స్థిరంగా ఉన్నాయి. గింజలో తేమ శాతం 12% కంటే తక్కువగా ఉండేలా చూసుకుంటే గరిష్ట ధర లభిస్తుంది."
          },
          {
            cropName: "Paddy (Basmati-1121)",
            localCropName: getLabel("धान (बासमती-1121)", "धान (बासमती-११२१)", "బాస్మతి వరి (1121)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 3850,
            priceChangePercent: 4.2,
            history4Weeks: [3600, 3700, 3780, 3850],
            marketStatus: "bullish",
            harvestAdvice: "Middle-east export demand for long grain has intensified. Millers are offering excellent spot cash incentives.",
            hindiHarvestAdvice: "मध्य-पूर्व खाड़ी देशों में निर्यात मांग तेज होने से मिलर्स बढ़-चढ़कर खरीद रहे हैं। नकद भुगतान का लाभ उठाएं।",
            teluguHarvestAdvice: "బాస్మతి బియ్యం ఎగుమతుల కారణంగా మిల్లుల వద్ద డిమాండ్ పెరిగింది. పంటను బాగా ఆరబెట్టి అమ్మితే మంచి ధర వస్తుంది."
          }
        ];

      case "Chikkaballapur":
        return [
          {
            cropName: "Tomato (Nandi F1)",
            localCropName: getLabel("टमाटर (नंदी F1)", "टमाटर (नंदी F1)", "టమోటా (నంది F1)"),
            unit: getLabel("Crate (15kg)", "क्रेट (१५ किलो)", "క్రేట్ (15 కేజీలు)"),
            currentPrice: 850,
            priceChangePercent: 12.8,
            history4Weeks: [520, 640, 780, 850],
            marketStatus: "bullish",
            harvestAdvice: "Inward crop failures in neighboring districts has led to sky-rocketing tomato prices. Pluck ripe fruits daily and dispatch them directly to secure high premiums.",
            hindiHarvestAdvice: "पड़ोसी जिलों में फसल खराब होने से टमाटर के दाम आसमान छू रहे हैं। पके फलों को रोजाना तोड़ें और मंडी भेजकर तुरंत इस तेजी का लाभ उठाएं।",
            teluguHarvestAdvice: "పక్క జిల్లాల్లో పంట నష్టం రావడం వలన టమోటా ధరలు ఆకాశాన్నంటుతున్నాయి. రోజూ పండిన కాయలను కోసి మార్కెట్‌కి పంపండి."
          },
          {
            cropName: "Silk Cocoons",
            localCropName: getLabel("रेशम कोकून (बाइ वोल्टाइन)", "रेशम कोकून", "పట్టు గూళ్లు"),
            unit: getLabel("Kg", "किलोग्राम", "కిలో"),
            currentPrice: 580,
            priceChangePercent: 3.5,
            history4Weeks: [540, 555, 565, 580],
            marketStatus: "bullish",
            harvestAdvice: "Ramanagara silk market buying is back to historical peaks. Ensure proper aeration to protect cocoons from transit stains.",
            hindiHarvestAdvice: "बनारसी वस्त्र बुनकरों से कोकून की मांग बहुत मजबूत है। कोकूनों को हवादार बक्से में रखें ताकि परिवहन के समय दाग धब्बे न आएं।",
            teluguHarvestAdvice: "పట్టు గూళ్లకు రామ నగర మార్కెట్లో అత్యధిక ధర లభిస్తోంది. రవాణాలో పట్టు గూళ్లు నలిగిపోకుండా తగిన జాగ్రత్తలు తీసుకోండి."
          },
          {
            cropName: "Ragi (Finger Millet)",
            localCropName: getLabel("रागी (मंडुआ)", "रागी देसी", "రాగులు (చోళ్లు)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 3890,
            priceChangePercent: 0.5,
            history4Weeks: [3850, 3870, 3880, 3890],
            marketStatus: "stable",
            harvestAdvice: "Steady millets wellness demand is supporting prices. Sell systematically via local farmer producer organizations (FPO) to get clean scales.",
            hindiHarvestAdvice: "प्राकृतिक आहार के रूप में रागी की मांग बहुत स्थिर है। स्थानीय किसान उत्पादक संघ (FPO) के माध्यम से तोल कराएं ताकि सही वजन मिले।",
            teluguHarvestAdvice: "చిరుధాన్యాలకు మార్కెట్లో మంచి స్పందన ఉంది. స్థానిక ఎఫ్.పి.ఓ (FPO)ల ద్వారా విక్రయిస్తే సరైన తూకం దక్కుతుంది."
          }
        ];

      case "Anand":
        return [
          {
            cropName: "Virginia Tobacco",
            localCropName: getLabel("तंबाकू (वर्जीनिया)", "तम्बाकू (वर्जीनिया)", "వర్జీనియా పొగాకు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 17500,
            priceChangePercent: 2.1,
            history4Weeks: [16800, 17000, 17200, 17500],
            marketStatus: "bullish",
            harvestAdvice: "Curing activities are progressing smoothly. Standard leaf brightness is commanding premium bids in auction yards.",
            hindiHarvestAdvice: "तंबाकू की सुखाई गतिविधियां सुचारू रूप से चल रही हैं। पत्तों की सुनहरी चमक के कारण नीलामी यार्ड में प्रीमियम बोलियां मिल रही हैं।",
            teluguHarvestAdvice: "पొగాకు పదును పనులు ఊపందుకున్నాయి. ఆకుల నాణ్యత బాగుండటం వల్ల వేలంలో మంచి ధరలు లభిస్తున్నాయి."
          },
          {
            cropName: "Groundnut (GG-20)",
            localCropName: getLabel("मूंगफली (जीजी-20)", "मूंगफली (गुजरात-२०)", "వేరుశనగ (GG-20)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7200,
            priceChangePercent: 1.5,
            history4Weeks: [6950, 7050, 7120, 7200],
            marketStatus: "stable",
            harvestAdvice: "Inward supply is balanced. Well-dried pods with moisture below 8% are securing strong premiums.",
            hindiHarvestAdvice: "मंडी में आवक संतुलित है। ८% से कम नमी वाली सूखी फलियों को तेल मिलों से तत्काल मजबूत भाव प्राप्त हो रहे हैं।",
            teluguHarvestAdvice: "వేరుశనగ రాక సమంగా ఉంది. 8% కంటే తక్కువ తేమ ఉన్న ఎండబెట్టిన కాయలకు మంచి ఆదరణ ఉంది."
          },
          {
            cropName: "American Cotton",
            localCropName: getLabel("अमेरिकी कपास", "कपास अमेरिकी", "అమెరికన్ పత్తి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7900,
            priceChangePercent: 4.5,
            history4Weeks: [7400, 7600, 7750, 7900],
            marketStatus: "bullish",
            harvestAdvice: "High textile demand is driving upward prices. Aim to harvest dry, clean cotton to achieve supreme lint parameters.",
            hindiHarvestAdvice: "कपड़ा मिलों से लगातार बढ़ती मांग कपास के दामों को ऊपर ले जा रही है। साफ़ सूती चुनाई करें ताकि उच्चतम दर मिले।",
            teluguHarvestAdvice: "టెక్స్‌టైల్స్ రంగం నుంచి పత్తికి భారీ ఎత్తున గిరాకీ ఉంది. తెల్లటి నాణ్యమైన పత్తిని ఏరి విక్రయించండి."
          }
        ];

      case "Burdwan":
        return [
          {
            cropName: "Kharif Paddy",
            localCropName: getLabel("खरीफ धान", "खरीफ धान", "ఖరీఫ్ వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2183,
            priceChangePercent: 0.0,
            history4Weeks: [2183, 2183, 2183, 2183],
            marketStatus: "stable",
            harvestAdvice: "Government minimum support price purchase is active. Ensure registration is completed on the local food portal.",
            hindiHarvestAdvice: "न्यूनतम समर्थन मूल्य (MSP) पर सरकारी खरीद जारी है। कृषि खरीद पोर्टल पर अपना पंजीकरण तुरंत सत्यापित करें।",
            teluguHarvestAdvice: "ప్రభుత్వ మద్దతు ధర కొనుగోళ్లు చురుగ్గా సాగుతున్నాయి. మీ వివరాలను పోర్టల్‌లో నమోదు చేసుకోండి."
          },
          {
            cropName: "Raw Jute (TD-5)",
            localCropName: getLabel("कच्चा जूट", "कच्चा जूट (पाटन)", "జనపనార (Raw Jute)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 5050,
            priceChangePercent: 5.8,
            history4Weeks: [4650, 4800, 4950, 5050],
            marketStatus: "bullish",
            harvestAdvice: "Industrial packaging requirements are pushing export needs. High fiber strength is fetching superb returns.",
            hindiHarvestAdvice: "बोरी मिलों से मांग में भारी उछाल आया है। फाइबर की अधिक लंबाई और मजबूती से किसानों को बेहतरीन दाम मिल रहे हैं।",
            teluguHarvestAdvice: "పరిశ్రమల నుంచి కొనుగోళ్లు పెరిగాయి. నార నాణ్యత ఆధారంగా వేలంలో అధిక ధర పలుకుతోంది."
          },
          {
            cropName: "Jyoti Potato",
            localCropName: getLabel("ज्योति आलू", "आलू (ज्योति)", "జ్యోతి బంగాళాదుంప"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 1450,
            priceChangePercent: -1.8,
            history4Weeks: [1520, 1490, 1470, 1450],
            marketStatus: "bearish",
            harvestAdvice: "Pressure from cold storage releases has slightly lowered prices. Stagger your sales rather than flooding the market.",
            hindiHarvestAdvice: "कोल्ड स्टोर से आलू बाहर आने से बाजार में हल्की मंदी है। पूरी फसल एक साथ बेचने के बजाय थोड़े अंतराल पर निकालें।",
            teluguHarvestAdvice: "కోల్డ్ స్టోరేజ్ నిల్వలు పెరగడం వల్ల ధర కాస్త తగ్గింది. పంటనంతా ఒకేసారి కాకుండా విడతల వారీగా అమ్ముకోండి."
          }
        ];

      case "Jorhat":
        return [
          {
            cropName: "Orthodox Black Tea",
            localCropName: getLabel("रूढ़िवादी चाय", "ऑर्थोडॉक्स असम चाय", "అస్సాం సాంప్రదాయ తేయాకు"),
            unit: getLabel("Kg", "किलोग्राम", "కిలో"),
            currentPrice: 280,
            priceChangePercent: 6.2,
            history4Weeks: [255, 262, 270, 280],
            marketStatus: "bullish",
            harvestAdvice: "Exceptional export premiums from European blenders are active. Keep plucking rounds tight to preserve high-yield tips.",
            hindiHarvestAdvice: "यूरोपीय देशों में निर्यात मांग बहुत मजबूत है। कोमल पत्तियों और कलियों की सही समय पर बारीक चुनाई से बेहतर ग्रेड पाएं।",
            teluguHarvestAdvice: "యూరోపియన్ దేశాలకు ఎగుమతులు బాగున్నాయి. కేవలం లేత కొమ్మలను కోసి నాణ్యత కాపాడితే గరిష్ట ధర లభిస్తుంది."
          },
          {
            cropName: "Yellow Mustard",
            localCropName: getLabel("पीली सरसों", "सरसों पीली", "పసుపు ఆవాలు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 5600,
            priceChangePercent: -1.2,
            history4Weeks: [5720, 5680, 5630, 5600],
            marketStatus: "bearish",
            harvestAdvice: "Abundant local seed crushing keeps the spot pricing quiet. Store extra lots in dry sheds until summer demand spikes.",
            hindiHarvestAdvice: "स्थानीय मिलों में भारी स्टॉक के कारण तेजी थमी है। फसल को सुखाकर कुछ सप्ताह रोकना ही उचित विकल्प रहेगा।",
            teluguHarvestAdvice: "ఆవాల రాక ఎక్కువగా ఉండటం వల్ల నిలకడగా ఉంది. వీలైతే కొద్ది రోజులు నిల్వ ఉంచి అమ్మడం లాభదాయకం."
          },
          {
            cropName: "Assam Lemon / Ginger",
            localCropName: getLabel("असम नींबू / अदरक", "असम नींबू और अदरक", "అస్సాం నిమ్మ / అల్లం"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 8500,
            priceChangePercent: 12.4,
            history4Weeks: [7200, 7600, 8100, 8500],
            marketStatus: "bullish",
            harvestAdvice: "Strong wellness processing demands have created significant shortages. Dig out rhizomes carefully to limit bruising.",
            hindiHarvestAdvice: "औद्योगिक और घरेलू स्वास्थ्य उपयोग से मांग अत्यधिक ऊंचे स्तर पर है। खुदाई सावधानी से करें ताकि गांठें क्षतिग्रस्त न हों।",
            teluguHarvestAdvice: "అల్లం, నిమ్మకాయలకు విపరీతమైన గిరాకీ ఉంది. అల్లం తవ్వేటప్పుడు దెబ్బతినకుండా జాగ్రత్తపడి మంచి గ్రేడ్ పొందండి."
          }
        ];

      case "Indore":
        return [
          {
            cropName: "Yellow Soybean (JS-9560)",
            localCropName: getLabel("सोयाबीन (पीला)", "सोयाबीन (पीला-९५६०)", "సోయాబీన్ (JS-9560)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 4450,
            priceChangePercent: 2.2,
            history4Weeks: [4280, 4350, 4400, 4450],
            marketStatus: "bullish",
            harvestAdvice: "Crushers and soy-oil refiners are purchasing stock aggressively. Grade well and sell at regional Mandis.",
            hindiHarvestAdvice: "तेल मिलों द्वारा भंडारण हेतु भारी खरीदारी की जा रही है। अच्छे से छनाई (ग्रेडिंग) करके माल बेचें ताकि उत्तम दर मिले।",
            teluguHarvestAdvice: "ఆయిల్ మిల్లులు సోయాబీన్‌ను పోటీపడి కొంటున్నాయి. చక్కగా గ్రేడింగ్ చేసి అమ్మితే మంచి లాభాలు వస్తాయి."
          },
          {
            cropName: "Malwi Durum Wheat",
            localCropName: getLabel("मालवी गेहूं", "मालवी डुरम गेहूँ", "మాళ్వా శర్బతి గోధుమ"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2850,
            priceChangePercent: 3.1,
            history4Weeks: [2720, 2760, 2800, 2850],
            marketStatus: "bullish",
            harvestAdvice: "Premium high-protein semolina makers are driving aggressive spot bids. Protect crop dry luster to keep grade high.",
            hindiHarvestAdvice: "सूजी व मैदा निर्माताओं की ओर से भारी मांग है। फसल की प्राकृतिक चमक बनाए रखें और नमी १२% के अंदर ही रखें।",
            teluguHarvestAdvice: "అధిక ప్రోటీన్ గల గోధుమలకు మార్కెట్లో అత్యధిక గిరాకీ ఉంది. మంచి రంగు కలిగిన గోధుమలను నిల్వ ఉంచండి."
          },
          {
            cropName: "Kabuli Chana (Dollar)",
            localCropName: getLabel("काबुली चना (डॉलर)", "डॉलर चना", "డాలర్ శనగలు (Kabuli)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 12200,
            priceChangePercent: -1.5,
            history4Weeks: [12600, 12400, 12300, 12200],
            marketStatus: "bearish",
            harvestAdvice: "Inward supply of fresh chickpea batches is driving short-term softness. Keep store dry to sell in early winter.",
            hindiHarvestAdvice: "मंडी में नए डॉलर चने की आवक से कीमतों में हल्का ठहराव है। घबराकर न बेचें तथा शुष्क भंडारण को तरजीह दें।",
            teluguHarvestAdvice: "కొత్త పంట వేగంగా మార్కెట్‌కు రావడం వల్ల ధరలు కాస్త తగ్గాయి. తడి లేకుండా పొడిగా ఉన్న చోట నిల్వ చేయండి."
          }
        ];

      case "Thanjavur":
        return [
          {
            cropName: "Samba Paddy (CR-1009)",
            localCropName: getLabel("सांबा धान", "सांबा धान (सीआर-१००९)", "సాంబ వరి రకం"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2250,
            priceChangePercent: 1.8,
            history4Weeks: [2180, 2210, 2230, 2250],
            marketStatus: "stable",
            harvestAdvice: "Direct Government purchase DPC center hubs are buying strongly. Ensure chaff is fully removed before loading.",
            hindiHarvestAdvice: "सरकारी खरीद केंद्र (DPC) पूरी क्षमता से खरीद रहे हैं। तौल से पहले धान की अच्छी ओसाई करके धूल-कचरा हटा लें।",
            teluguHarvestAdvice: "ప్రభుత్వ కొనుగోలు కేంద్రాలు జోరుగా కొంటున్నాయి. లోడింగ్ చేయడానికి ముందే తాలు గింజలను పూర్తిగా తొలగించండి."
          },
          {
            cropName: "De-husked Coconut",
            localCropName: getLabel("नारियल (बिना छिलका)", "नारियल (साफ़ पानीदार)", "వలిచిన కొబ్బరికాయలు"),
            unit: getLabel("100 Nuts", "सौ नारियल", "వంద కొబ్బరికాయలు"),
            currentPrice: 1850,
            priceChangePercent: -2.2,
            history4Weeks: [1950, 1920, 1880, 1850],
            marketStatus: "bearish",
            harvestAdvice: "Monsoon supply spikes in neighboring regions have slowed the price growth. Pick only well-formed fully matured nuts.",
            hindiHarvestAdvice: "पड़ोसी डेल्टा क्षेत्रों में नारियल की अधिक आवक से कीमतों पर दबाव है। केवल पूरी तरह पके पानी वाले गरीदार नारियल ही चुनें।",
            teluguHarvestAdvice: "పక్క జిల్లాల నుంచి కొబ్బరి కాయల రాక పెరగడం వల్ల ధర తగ్గింది. ముదురు కొబ్బరి కాయలను ఏరి పంపండి."
          },
          {
            cropName: "Black Gram (Urad)",
            localCropName: getLabel("उड़द (काली दाल)", "उड़द देसी काली", "మినుములు (నల్ల శనగలు)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7400,
            priceChangePercent: 5.4,
            history4Weeks: [6900, 7100, 7250, 7400],
            marketStatus: "bullish",
            harvestAdvice: "Severe supply deficit in south markets is creating intense bid competitions. Bring clean grain to secure peak pricing.",
            hindiHarvestAdvice: "दाल मिलों से उड़द की मांग अत्यंत तीव्र है। अपनी सूखी दाल को अच्छे से साफ़ कर ग्रेडिंग करके दक्षिण भारतीय मंडियों में भेजें।",
            teluguHarvestAdvice: "మినుములకు గిరాకీ చాలా బలంగా ఉంది. పొట్టు లేని నాణ్యమైన మినుములకు బంపర్ ధరలు లభిస్తున్నాయి."
          }
        ];

      case "Jodhpur":
        return [
          {
            cropName: "Pearl Millet (Hybrid Bajra)",
            localCropName: getLabel("बाजरा (हाइब्रिड)", "बाजरा (देसी मारवाड़)", "సజ్జలు (హైబ్రిడ్)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2500,
            priceChangePercent: 1.2,
            history4Weeks: [2440, 2460, 2480, 2500],
            marketStatus: "stable",
            harvestAdvice: "Domestic fodder and grain feed factories maintain a steady procurement flow. Dry the ears fully to avoid fungus.",
            hindiHarvestAdvice: "पशु आहार तथा बाजरा प्रसंस्करण इकाइयों से मांग सामान्य बनी हुई है। अनाज को धूप में सुखाकर फफूंद से बचाएं।",
            teluguHarvestAdvice: "సజ్జలకి మార్కెట్లో సాధారణ గిరాకీ ఉంది. బూజు పట్టకుండా గింజలను పూర్తిగా ఎండబెట్టడం ముఖ్యం."
          },
          {
            cropName: "Guar Seed (Cluster Bean)",
            localCropName: getLabel("ग्वार गम बीज", "ग्वार गम बीज", "గువారు గింజలు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 580,
            priceChangePercent: 8.5,
            history4Weeks: [520, 545, 560, 580],
            marketStatus: "bullish",
            harvestAdvice: "Industrial extraction factories in Jodhpur city are paying premium cash rates. Protect spot crops from desert winds.",
            hindiHarvestAdvice: "ग्वार गम प्रसंस्करण उद्योगों से जबरदस्त मांग है। थोक व्यापारी अग्रिम नकद भुगतान देकर खरीद रहे हैं।",
            teluguHarvestAdvice: "ఇండస్ట్రియల్ ప్రాసెసింగ్ కంపెనీల నుంచి మంచి డిమాండ్ ఉంది. మార్కెట్లో నగదు లావాదేవీలు బలంగా ఉన్నాయి."
          },
          {
            cropName: "Cumin Seed (Jeera Grade-A)",
            localCropName: getLabel("जीरा (ग्रेड-ए)", "जीरा (उंझा क्वालिटी)", "జీలకర్ర (గ్రేడ్-ఎ)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 32000,
            priceChangePercent: -4.2,
            history4Weeks: [34200, 33500, 32800, 32000],
            marketStatus: "bearish",
            harvestAdvice: "Inflow of newer crops at Unjha yard is causing moderate price correction. Retain clean lots in airtight storage bags.",
            hindiHarvestAdvice: "ऊंझा मंडी में बंपर नया जीरा आने से दाम कुछ कम हुए हैं। जिंस को हवा-बंद थैलों में रखें और सही समय पर बेचें।",
            teluguHarvestAdvice: "మార్కెట్లోకి జీలకర్ర భారీగా రావడం వలన ధరలు తగ్గుముఖం పట్టాయి. గాలి చొరబడని సంచుల్లో నిల్వ చేస్తే మేలు."
          }
        ];

      case "Shimla":
        return [
          {
            cropName: "Royal Apple Orchards",
            localCropName: getLabel("रॉयल सेब", "रॉयल सेब (हिमाचली)", "రాయల్ ఆపిల్స్"),
            unit: getLabel("Box (20kg)", "पेटिका (२० किलो)", "బాక్స్ (20 కేజీలు)"),
            currentPrice: 1450,
            priceChangePercent: 8.2,
            history4Weeks: [1300, 1360, 1400, 1450],
            marketStatus: "bullish",
            harvestAdvice: "Metropolitan cold chain suppliers have initiated heavy storage contracts. Pack carefully in eco-trays for transport safety.",
            hindiHarvestAdvice: "दिल्ली और मुंबई के बड़े शीत-गृह संगठनों से बढ़िया अग्रिम मांग है। सेब पर जैविक मोम और ट्रे पैक का प्रयोग करें।",
            teluguHarvestAdvice: "పెద్ద నగరాల నుంచి ఆర్డర్లు ఎక్కువగా ఉన్నాయి. పండ్లు దెబ్బతినకుండా ఎకో-ట్రేలలో ప్యాక్ చేసి రవాణా చేయండి."
          },
          {
            cropName: "Off-season Green Peas",
            localCropName: getLabel("अगेती हरी मटर", "हरी मटर (बेमौसमी)", "పచ్చి బఠానీలు"),
            unit: getLabel("Quintal", "क्विंटल", "क्विంటాల్"),
            currentPrice: 7500,
            priceChangePercent: 4.1,
            history4Weeks: [7100, 7250, 7380, 7500],
            marketStatus: "bullish",
            harvestAdvice: "Very high fresh salad demand in warm plains is boosting prices. Pluck in chill mornings and dispatch in ventilated sacks.",
            hindiHarvestAdvice: "मैदानी इलाकों में गर्मियों में हरी मटर की अपार मांग है। सुबह की ठंडक में तुड़ाई करें और जालीदार बोरे में ही भेंजे।",
            teluguHarvestAdvice: "వేసవి కాలంలో పచ్చి బఠానీలకు మైదాన ప్రాంతాల్లో మంచి డిమాండ్ ఉంది. ఉదయం పూట కోసి మార్కెట్‌కు తరలించండి."
          },
          {
            cropName: "Seed Tomato",
            localCropName: getLabel("बीज टमाटर", "टमाटर सोलन गोल", "టమోటా విత్తనాలు"),
            unit: getLabel("Crate (25kg)", "क्रेट (२५ किलो)", "క్రేట్ (25 కేజీలు)"),
            currentPrice: 1200,
            priceChangePercent: -2.8,
            history4Weeks: [1290, 1260, 1230, 1200],
            marketStatus: "bearish",
            harvestAdvice: "Strong regional harvests have stabilized the supply chain. Pick early pink-stage fruits to survive longer cargo routes.",
            hindiHarvestAdvice: "मैदानी टमाटर की स्थानिक आवक से दाम स्थिर हैं। दूर की मंडियों के लिए टमाटर को हल्के गुलाबी रंग में ही तोड़कर भेजें।",
            teluguHarvestAdvice: "టమోటా దిగుబడి పెరగడం వల్లే ధర కొంచెం నిలకడగా ఉంది. లాంగ్ రూట్ రవాణా కోసం కాయ పూర్తిగా పండక ముందే కోయండి."
          }
        ];

      case "Warangal":
        return [
          {
            cropName: "Medium-Staple Cotton",
            localCropName: getLabel("मध्यम कपास", "कपास वारंगल मध्यम", "పత్తి (మ్యాక్సీ పింజ)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7100,
            priceChangePercent: 3.6,
            history4Weeks: [6700, 6850, 6980, 7100],
            marketStatus: "bullish",
            harvestAdvice: "Adilabad and Guntur spinning operators are bidding actively. Sort yellow fibers before submitting to the market.",
            hindiHarvestAdvice: "स्थानीय कपड़ा मिलों से मजबूत व्यावसायिक मांग उठ रही है। पीली बत्तियों और दागदार रुई को अलग छांटकर ही मंडी लाएं।",
            teluguHarvestAdvice: "రోజూ పత్తి కొనుగోళ్లు ఊపందుకుంటున్నాయి. పసుపు రంగు పత్తిని వేరు చేసి అమ్మితే నాణ్యమైన పత్తికి అధిక ధర దక్కుతుంది."
          },
          {
            cropName: "Teja Guntur Chilli (Dry)",
            localCropName: getLabel("तेजा मिर्च (सूखी)", "तेजा सूखी लाल मिर्च", "తేజ గుంటూరు ఎండుమిర్చి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 19500,
            priceChangePercent: 6.8,
            history4Weeks: [17800, 18500, 19100, 19500],
            marketStatus: "bullish",
            harvestAdvice: "Premium export offers for bright powder manufacturing are high. Keep pods dried fully to achieve rich compliance.",
            hindiHarvestAdvice: "निर्यातकों द्वारा तीखे तीखेपन और गहरे लाल रंग की मांग के कारण तेजी है। सुखाने की क्रिया छायादार फर्श पर ही करें।",
            teluguHarvestAdvice: "రవాణా ఎగుమతుల వల్ల తేజా మిర్చి ధర కొండెక్కింది. కాయలను బాగా ఎండబెట్టి నీడ ఉన్న చోట నిల్వ చేయండి."
          },
          {
            cropName: "Hybrid Yellow Maize",
            localCropName: getLabel("हाइब्रिड पीला मक्का", "मक्का पीला हाइब्रिड", "హైబ్రిడ్ పసుపు మొక్కజొన్న"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2100,
            priceChangePercent: -1.2,
            history4Weeks: [2160, 2140, 2120, 2100],
            marketStatus: "bearish",
            harvestAdvice: "Inflow of maize from central silos is cooling local bids. Secure moisture content below 14% to escape price cuts.",
            hindiHarvestAdvice: "बाहरी राज्यों से आवक तेज है जिससे मांग थोड़ी सुस्त है। अपने मक्के को अच्छे से सुखाएं ताकि नमी छूट न मिले।",
            teluguHarvestAdvice: "పక్క రాష్ట్రాల నుంచి మొక్కజొన్న రావడం వల్ల కొద్దిగా తగ్గింది. తేమ శాతం 14% దాటకుండా ఎండబెట్టి విక్రయించండి."
          }
        ];

      
      case "Guntur":
        return [
          {
            cropName: "Teja Dry Red Chilli",
            localCropName: getLabel("तेजा सूखी लाल मिर्च", "तेजा सूखी लाल मिर्च", "తేజ గుంటూరు ఎండుమిర్చి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 19800,
            priceChangePercent: 5.4,
            history4Weeks: [18600, 19100, 19400, 19800],
            marketStatus: "bullish",
            harvestAdvice: "High international export demand for bright spice standards is driving stellar bids. Clean properly to secure full value.",
            hindiHarvestAdvice: "तीखे स्वाद और निर्यात मांग से तेजा मिर्च रिकॉर्ड स्तर पर है। सफाई और सुखाने का विशेष ध्यान रखें।",
            teluguHarvestAdvice: "విదేశీ ఎగుమతుల వల్ల తేజా మిర్చికి మునుపెన్నడూ లేని గిరాకీ ఉంది. కాయలను టార్పాలిన్లపై శుభ్రంగా ఎండబెట్టండి."
          },
          {
            cropName: "Long-Staple Cotton",
            localCropName: getLabel("लंबा रेशा कपास", "कपास लंबा रेशा", "పత్తి (పొడువు పింజ)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7200,
            priceChangePercent: 2.1,
            history4Weeks: [6900, 7050, 7120, 7200],
            marketStatus: "bullish",
            harvestAdvice: "Guntur spinning operators are bidding actively for premium grade cotton. Separate stained fibers.",
            hindiHarvestAdvice: "लंबा रेशा कपास की कताई मिलों से अच्छी मांग है। पीली बत्तियों को अलग छांटकर मंडी लाएं।",
            teluguHarvestAdvice: "ప్రముఖ మిల్లుల నుంచి కొనుగోళ్లు పెరిగాయి. పసుపు రంగు మారిన పత్తిని వేరు చేసి అమ్మడం మంచిది."
          },
          {
            cropName: "Swarna Paddy",
            localCropName: getLabel("स्वर्ण धान", "स्वर्ण धान", "స్వర్ణ వరి రకం"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2280,
            priceChangePercent: 0.5,
            history4Weeks: [2250, 2260, 2270, 2280],
            marketStatus: "stable",
            harvestAdvice: "Steady procurement of traditional varieties. Check moisture levels before taking to Local Mandis.",
            hindiHarvestAdvice: "स्वर्ण धान की खरीद सामान्य रूप से जारी है। नमी १४% के अंदर ही सुरक्षित रखें।",
            teluguHarvestAdvice: "స్వర్ణ వరి కొనుగోళ్లు స్థిరంగా ఉన్నాయి. గింజల్లో తేమ శాతం 14% కంటే తక్కువగా ఉండేలా చూసుకోండి."
          }
        ];

      case "Kurnool":
        return [
          {
            cropName: "Kurnool Sona Paddy",
            localCropName: getLabel("कुरनूल सोना धान", "कुरनूल सोना धान", "కర్నూలు సోనా వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2550,
            priceChangePercent: 3.8,
            history4Weeks: [2420, 2480, 2510, 2550],
            marketStatus: "bullish",
            harvestAdvice: "Sona Masuri has exceptional premium rates in urban retail markets. Secure peak price for thin-grain varieties.",
            hindiHarvestAdvice: "सोना मसूरी की शहरी मंडियों में जबरदस्त मांग है। अच्छी छनाई और ग्रेडिंग अवश्य करें।",
            teluguHarvestAdvice: "సన్న రకం కర్నూలు సోనా బియ్యానికి హైదరాబాద్ మార్కెట్లో విపరీతమైన డిమాండ్ ఉంది. గ్రేడింగ్ తప్పనిసరి."
          },
          {
            cropName: "Kurnool Red Onion",
            localCropName: getLabel("कुरनूल लाल प्याज", "लाल प्याज (कुरनूल)", "కర్నూలు ఎర్ర ఉల్లిపాయ"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 1800,
            priceChangePercent: -2.3,
            history4Weeks: [1950, 1900, 1840, 1800],
            marketStatus: "bearish",
            harvestAdvice: "Harvest arrivals across neighboring states have created brief correction. Store in ventilated sheds if price drops.",
            hindiHarvestAdvice: "पड़ोसी राज्यों से प्याज की आवक बढ़ने से मंदी है। हवादार जालीदार शेड में भंडारण करें।",
            teluguHarvestAdvice: "ఉల్లిపాయల రాక పెరగడం వల్ల రంగు, సైజు ఆధారంగా ధర నిర్ణయిస్తున్నారు. వీలైతే కొన్ని రోజులు ఆరబెట్టి నిల్వ చేయండి."
          },
          {
            cropName: "Bengal Gram (Chana)",
            localCropName: getLabel("चना (देश)", "देसी चना (कुरनूल)", "శనగలు (Bengal Gram)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 5350,
            priceChangePercent: 1.2,
            history4Weeks: [5250, 5290, 5320, 5350],
            marketStatus: "stable",
            harvestAdvice: "Stable mill purchase indices. Avoid immediate selling if moisture exceeds 12% to prevent deductions.",
            hindiHarvestAdvice: "दाल मिलों से देसी चने की सामान्य मांग है। फसल को अच्छी तरह सुखाकर मंडी लाएं।",
            teluguHarvestAdvice: "శనగలకు మిల్లుల నుంచి కొనుగోళ్లు నిలకడగా ఉన్నాయి. 12% తేమ కంటే తక్కువగా ఉంటే మంచి ధర లభిస్తుంది."
          }
        ];

      case "East Godavari":
        return [
          {
            cropName: "Godavari Samba Paddy",
            localCropName: getLabel("गोदावरी सांबा धान", "गोदावरी सांबा धान", "గోదావరి సాంబ వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2300,
            priceChangePercent: 1.5,
            history4Weeks: [2240, 2260, 2280, 2300],
            marketStatus: "stable",
            harvestAdvice: "Excellent yields in Godavari delta canals. Utilize direct buying centers to save intermediate dry commissions.",
            hindiHarvestAdvice: "डेल्टा क्षेत्र में धान की भरपूर उपज। बिचौलियों से बचने के लिए सीधे सरकारी क्रय केंद्र पर जाएं।",
            teluguHarvestAdvice: "గోదావరి డెల్టా కాలువల పరిధిలో రికార్డు దిగుబడులు వచ్చాయి. దళారులను నమ్మి నష్టపోకుండా కొనుగోలు కేంద్రాలకు వెళ్లండి."
          },
          {
            cropName: "Delta Coconut",
            localCropName: getLabel("डेल्टा नारियल", "नारियल (पानीदार साफ़)", "గోదావరి కొబ్బరికాయలు"),
            unit: getLabel("100 Nuts", "सौ नारियल", "వంద కొబ్బరికాయలు"),
            currentPrice: 1900,
            priceChangePercent: -1.0,
            history4Weeks: [1950, 1930, 1915, 1900],
            marketStatus: "stable",
            harvestAdvice: "Steady summer volumes. Harvest only mature fruits to extract maximum Copra oil yield values.",
            hindiHarvestAdvice: "नारियल की आवक स्थिर बनी हुई है। केवल पूरी तरह पके सूखे गोले वाले नारियल ही चुनें।",
            teluguHarvestAdvice: "కొబ్బరి దిగుమతులు నిలకడగా ఉన్నాయి. కొబ్బరి నూనె తయారీ మిల్లుల నుంచి కొనుగోళ్లు బాగున్నాయి."
          },
          {
            cropName: "Cavendish Banana",
            localCropName: getLabel("कैवेंडिश केला", "कैवेंडिश केला", "పచ్చ అరటి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 1650,
            priceChangePercent: 6.2,
            history4Weeks: [1510, 1550, 1600, 1650],
            marketStatus: "bullish",
            harvestAdvice: "High domestic festival bids this month. Pack carefully to minimize transport friction bruises.",
            hindiHarvestAdvice: "त्योहारों के कारण केले की मांग बहुत बढ़िया है। परिवहन के दौरान फल खराब होने से बचाएं।",
            teluguHarvestAdvice: "పండుగ సీజన్ కావడంతో అరటి ధరలు పెరిగాయి. రవాణాలో దెబ్బతినకుండా జాగ్రత్తపడండి."
          }
        ];

      case "West Godavari":
        return [
          {
            cropName: "BPT-5204 Paddy",
            localCropName: getLabel("बीपीटी धान", "बीपीटी-५२०४ धान", "BPT-5204 సన్న బియ్యం వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2400,
            priceChangePercent: 2.5,
            history4Weeks: [2310, 2340, 2375, 2400],
            marketStatus: "bullish",
            harvestAdvice: "BPT commands premium rice milling rates. Keep grain bright and avoid rain wetting during sun drying.",
            hindiHarvestAdvice: "बीपीटी महीन किस्म होने से मूल्यवान है। सुखाने के दौरान असमय बारिश से अनाज को बचाएं।",
            teluguHarvestAdvice: "మిల్లర్లలో BPT రకానికి మంచి డిమాండ్ ఉంది. ఎండబెట్టేటప్పుడు వర్షపు తడి తగలకుండా జాగ్రత్త పడండి."
          },
          {
            cropName: "Coimbatore Sugarcane",
            localCropName: getLabel("गन्ना कोइम्बटूर", "गन्ना (कोइम्बटूर)", "చెరకు (Co-86032 రకం)"),
            unit: getLabel("Quintal (SAP)", "क्विंटल (सरकारी दर)", "క్వింటాల్ (SAP రేట్)"),
            currentPrice: 380,
            priceChangePercent: 0.0,
            history4Weeks: [380, 380, 380, 380],
            marketStatus: "stable",
            harvestAdvice: "Local sugar cooperatives are offering steady state-assured rates. Deliver within 24 hours of cutting.",
            hindiHarvestAdvice: "स्थानीय चीनी मिलें निर्धारित दर पर खरीद रही हैं। कटाई के तुरंत बाद मिल पहुंच सुनिश्चित करें।",
            teluguHarvestAdvice: "సహకార చక్కెర మిల్లులు ప్రభుత్వ ధరకు సకాలంలో కొంటున్నాయి. నరికిన 24 గంటల్లో చెరకు తోలండి."
          },
          {
            cropName: "Acid Lime (Lemon)",
            localCropName: getLabel("नींबू (देशी)", "नींबू (देशी गोल)", "దేశవాళీ నిమ్మకాయలు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 5500,
            priceChangePercent: 12.0,
            history4Weeks: [4700, 5100, 5350, 5500],
            marketStatus: "bullish",
            harvestAdvice: "Summer heat is driving huge beverage processor demands. Pick early morning for shiny skin luster.",
            hindiHarvestAdvice: "गर्मियों में शिकंजी और जूस कंपनियों से नींबू की मांग चरम पर है। सुबह जल्दी तुड़ाई कर भेजें।",
            teluguHarvestAdvice: "వేసవి ఎండల వల్ల నిమ్మకాయలకు విపరీతమైన గిరాకీ ఉంది. నిగనిగలాడే పండ్లను ఏరి కోయండి."
          }
        ];

      case "Chittoor":
        return [
          {
            cropName: "Madanapalle Tomato",
            localCropName: getLabel("मदनपल्ले टमाटर", "टमाटर (मदनपल्ले)", "మదనపల్లె టమోటా"),
            unit: getLabel("Crate (25kg)", "क्रेट (२५ किलो)", "క్రేట్ (25 కేజీలు)"),
            currentPrice: 1400,
            priceChangePercent: 10.5,
            history4Weeks: [1180, 1250, 1320, 1400],
            marketStatus: "bullish",
            harvestAdvice: "Tomato prices are soaring in Madanapalle Asia-famous market. Grade them by ripeness for maximum margin.",
            hindiHarvestAdvice: "मदनपल्ले मंडी में टमाटर के दामों में भारी तेजी। पकाव के अनुसार छांटकर अलग क्रेट्स में ही भेजें।",
            teluguHarvestAdvice: "మదనపల్లె మార్కెట్ లో టమోటా ధరలు ఆకాశాన్నంటుతున్నాయి. రంగు, సైజు వారీగా సార్టింగ్ చేస్తే అధిక లాభాలు."
          },
          {
            cropName: "Banginapalli Mango",
            localCropName: getLabel("बनगनपल्ली आम", "बनगनपल्ली आम (विशाख)", "బంగినపల్లి మామిడి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 6500,
            priceChangePercent: 8.4,
            history4Weeks: [5800, 6100, 6300, 6500],
            marketStatus: "bullish",
            harvestAdvice: "Mango processing units are calling for immediate pesticide-managed green harvests. Premium quality is paying well.",
            hindiHarvestAdvice: "बनगनपल्ली आम का सीजन जोरों पर है। फलों पर दाग न लगने दें; जैविक चमक वाले बॉक्स के बढ़िया दाम हैं।",
            teluguHarvestAdvice: "బంగినపల్లి మామిడి పండ్ల సీజన్ బాగుంది. మచ్చలు లేని నాణ్యమైన కాయలను నిలకడగా గ్రేడింగ్ చేసి అమ్మండి."
          },
          {
            cropName: "Kadiri Groundnut",
            localCropName: getLabel("कादिरी मूंगफली", "मूंगफली (कादिरी)", "కదిరి వేరుశనగ కాయలు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 6800,
            priceChangePercent: -0.5,
            history4Weeks: [6900, 6850, 6820, 6800],
            marketStatus: "stable",
            harvestAdvice: "Decent oil recovery from dry soils. Decorticate seeds carefully before submission to local shellers.",
            hindiHarvestAdvice: "तेल मिलों द्वारा मूंगफली सामान्य दर पर खरीदी जा रही है। अच्छे से सुखाकर ही मंडी लाएं।",
            teluguHarvestAdvice: "నూనె మిల్లులు కదిరి వేరుశనగను సాధారణ ధరలోనే కొంటున్నాయి. తేమ లేకుండా ఆరబెట్టడం అవసరం."
          }
        ];

      case "Nellore":
        return [
          {
            cropName: "Nellore Masuri Paddy",
            localCropName: getLabel("नेल्लोर मसूरी धान", "नेल्लोर मसूरी धान", "నేల్లాటి మసూరి వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2450,
            priceChangePercent: 1.8,
            history4Weeks: [2380, 2410, 2430, 2450],
            marketStatus: "stable",
            harvestAdvice: "Nellore rice mills are operating at high capacity. Keep grain dry to avoid mold infections under storage.",
            hindiHarvestAdvice: "नेल्लोर धान मिलों द्वारा स्थिर खरीदारी जारी है। भंडारण में फंगस से बचाव हेतु नमी नियंत्रित रखें।",
            teluguHarvestAdvice: "నెల్లూరు రైస్ మిల్లులు పూర్తి స్థాయిలో కొనుగోళ్లు చేస్తున్నాయి. నిల్వ గదిలో తేమ లేకుండా చూసుకోండి."
          },
          {
            cropName: "Black Gram (Desi Urad)",
            localCropName: getLabel("उड़द (काली)", "देशी उड़द दाल", "మినుములు (నల్ల బియ్యం)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7600,
            priceChangePercent: 4.8,
            history4Weeks: [7100, 7300, 7450, 7600],
            marketStatus: "bullish",
            harvestAdvice: "High competition among south regional dal mills is creating immense bidding. Clean trash before bagging.",
            hindiHarvestAdvice: "दाल मिलों से उड़द की मांग मजबूत होने से बाजार तेज। धान काटने के तुरंत बाद दाल मंडी लाएं।",
            teluguHarvestAdvice: "మినుములకు మార్కెట్లో అద్భుతమైన గిరాకీ ఉంది. తాలు లేకుండా గాలి తూకం పట్టి సంచుల్లో నింపండి."
          }
        ];

      case "Kadapa":
        return [
          {
            cropName: "Salem Turmeric",
            localCropName: getLabel("सेलम हल्दी", "सेलम हल्दी (कडप्पा)", "కడప సేలం పసుపు కొమ్ములు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 13500,
            priceChangePercent: 9.8,
            history4Weeks: [11900, 12600, 13150, 13500],
            marketStatus: "bullish",
            harvestAdvice: "Severe turmeric shortfalls in prime markets are causing multi-year price records. Boil and dry expertly.",
            hindiHarvestAdvice: "कडप्पा हल्दी के रिकॉर्ड भाव मिल रहे हैं। उबलने और सुखाने की वैज्ञानिक विधि अपनाएं ताकि पीलापन बढ़े।",
            teluguHarvestAdvice: "పసుపు కొమ్ముల ధర ఊహించని రీతిలో పెరిగింది. ఉడకబెట్టేటప్పుడు, ఎండబెట్టేటప్పుడు నాణ్యత కాపాడితే గరిష్ట ధర లభిస్తుంది."
          },
          {
            cropName: "Sweet Lime (Mosambi)",
            localCropName: getLabel("मौसंबी (कडप्पा)", "कडप्पा मीठा नींबू", "బత్తాయి (Sweet Lime)"),
            unit: getLabel("Ton", "टन", "టన్ను"),
            currentPrice: 42000,
            priceChangePercent: 5.2,
            history4Weeks: [38500, 40000, 41200, 42000],
            marketStatus: "bullish",
            harvestAdvice: "High juice stall demands under burning summer sun are driving price peaks. Avoid water logging near roots.",
            hindiHarvestAdvice: "भीषण गर्मी में मौसंबी का जूस बाजार बहुत मजबूत है। बगीचियों से थोक उठान अच्छे मूल्यों पर हो रहा है।",
            teluguHarvestAdvice: "వేసవి ఎండలకు బత్తాయి పండ్ల గిరాకీ బలంగా పెరిగింది. తోటల కొనుగోలుదారులు మంచి ధర చెల్లిస్తున్నారు."
          }
        ];

      case "Visakhapatnam":
        return [
          {
            cropName: "Araku Valley Coffee",
            localCropName: getLabel("अराकू कॉफी", "अराकू वैली ऑर्गेनिक कॉफ़ी", "అరకు వ్యాలీ ఆర్గానిక్ కాఫీ"),
            unit: getLabel("Kg", "किलोग्राम", "కిలో"),
            currentPrice: 320,
            priceChangePercent: 7.5,
            history4Weeks: [292, 301, 310, 320],
            marketStatus: "bullish",
            harvestAdvice: "Organic export certifications for Araku beans are getting premium buyers. Keep cherries shade-dried.",
            hindiHarvestAdvice: "अराकू ऑर्गेनिक कॉफी की अंतर्राष्ट्रीय निर्यात मांग अत्यधिक बढ़ गई है। छाया में सुखाई गई बीजों को प्रीमियम दर मिलेगी।",
            teluguHarvestAdvice: "అరకు వ్యాలీ ఆర్గానిక్ కాఫీ గింజలకు విదేశాల్లో మంచి క్రేజ్ ఉంది. నీడన ఆరబెట్టి నాణ్యత కాపాడండి."
          },
          {
            cropName: "Finger Millet (Ragi)",
            localCropName: getLabel("रागी (मंडुआ)", "रागी देसी", "రాగులు (Finger Millet)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 3200,
            priceChangePercent: 1.5,
            history4Weeks: [3120, 3160, 3190, 3200],
            marketStatus: "stable",
            harvestAdvice: "Excellent grain hardness. Millet breakfast food processors are increasing spot procurements weekly.",
            hindiHarvestAdvice: "पोषक अनाजों (रागी) की मांग में तेजी है। सफाई करके अच्छी तरह पैक करके सीधे शहर मंडी लाएं।",
            teluguHarvestAdvice: "ఆరోగ్య స్పృహ పెరగడంతో రాగులకు గిరాకీ నిలకడగా ఉంది. పిండి మిల్లుల నుంచి కొనుగోళ్లు బాగున్నాయి."
          }
        ];

      case "Srikakulam":
        return [
          {
            cropName: "Coastal Swarna Paddy",
            localCropName: getLabel("तटीय स्वर्ण धान", "स्वर्ण धान (श्रीकाकुलम)", "శ్రీకాకుళం స్వర్ణ వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2200,
            priceChangePercent: 0.8,
            history4Weeks: [2160, 2180, 2190, 2200],
            marketStatus: "stable",
            harvestAdvice: "Direct Government Paddy procurement hubs are active. Ensure chaff was fully removed before weighing.",
            hindiHarvestAdvice: "सरकारी क्रय केंद्र सक्रिय हैं। तौल से पहले धान की अच्छी ओसाई करके कचरा हटा लें।",
            teluguHarvestAdvice: "ప్రభుత్వ పిపిసి కేంద్రాలు సక్రమంగా నడుస్తున్నాయి. గింజలు పోసి పొట్టు తీసి అమ్మకానికి సిద్ధం చేయండి."
          },
          {
            cropName: "Raw Cashew Nut",
            localCropName: getLabel("कच्चा काजू बीज", "कच्चा काजू", "శ్రీకాకుళం పచ్చి జీడిపప్పు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 9500,
            priceChangePercent: 4.2,
            history4Weeks: [8900, 9150, 9300, 9500],
            marketStatus: "bullish",
            harvestAdvice: "Cashew processing factories are paying direct spot cash for high kernel outturn ratio (KOR) batches.",
            hindiHarvestAdvice: "स्थानीय काजू मिलों द्वारा तटीय काजू की अच्छी नकद खरीद की जा रही है। सूखी धूप में सुखाएं।",
            teluguHarvestAdvice: "స్థానిక జీడిపప్పు పరిశ్రమలు నేరుగా కొంటున్నాయి. ఎండలో బాగా ఎండబెట్టి గింజ పరిమాణం ఆధారంగా అమ్మండి."
          }
        ];

      case "Vizianagaram":
        return [
          {
            cropName: "Mesta Fiber (Jute-like)",
            localCropName: getLabel("मेस्टा रेशा", "मेस्टा रेशा", "మెస్తా నార పీచు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 4800,
            priceChangePercent: 3.5,
            history4Weeks: [4600, 4680, 4740, 4800],
            marketStatus: "stable",
            harvestAdvice: "Traditional gunny package mills are buying stable reserves. Water retting needs clean streams.",
            hindiHarvestAdvice: "जूट मिलों से मेस्टा फाइबर की अच्छी मांग। सफाई और रेशों की मजबूती पर ध्यान दें।",
            teluguHarvestAdvice: "గోనె సంచుల మిల్లుల నుంచి మెస్తా నారకు స్థిరమైన డిమాండ్ ఉంది. నారను బాగా పులియబెట్టి కడగాలి."
          },
          {
            cropName: "Hybrid Yellow Maize",
            localCropName: getLabel("हाइब्रिड पीला मक्का", "हाइब्रिड मक्का", "హైబ్రిడ్ పసుపు మొక్కజొన్న"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2050,
            priceChangePercent: -1.0,
            history4Weeks: [2100, 2080, 2070, 2050],
            marketStatus: "bearish",
            harvestAdvice: "Animal feed companies are paying slightly lesser values due to high rain moisture arrivals. Dry well.",
            hindiHarvestAdvice: "पशु आहार मिलें अधिक नमी के कारण कम भाव दे रही हैं। मक्के को सुखाकर ही लाएं।",
            teluguHarvestAdvice: "పశుగ్రాసం మిల్లులు తెమ ఎక్కువ ఉన్నందున ధర తగ్గించాయి. కాయల నుంచి గింజలను పూర్తిగా ఎండబెట్టండి."
          }
        ];

      case "Krishna":
        return [
          {
            cropName: "Premium BPT Paddy",
            localCropName: getLabel("प्रीमियम बीपीटी धान", "महीन बीपीटी", "కృష్ణా ప్రీమియం BPT వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2380,
            priceChangePercent: 1.2,
            history4Weeks: [2330, 2350, 2370, 2380],
            marketStatus: "stable",
            harvestAdvice: "Sowing in delta canal zone has yielded fine-grain crops. Keep store rooms highly ventilated.",
            hindiHarvestAdvice: "कृष्णा डेल्टा के धान मिलों से बढ़िया उठाव है। सुरक्षित रखने के लिए बंद गोडाउन से बचें।",
            teluguHarvestAdvice: "డెల్టా కాలువల నీటితో మంచి నాణ్యత వచ్చింది. నిల్వ కోటార్లలో గాలి ఆడటం చాలా ముఖ్యం."
          },
          {
            cropName: "Chinnarasalu Mango",
            localCropName: getLabel("चिन्नरसालु आम", "चिन्नरसालु रसीला आम", "చిన్నరసాలు మామిడి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7200,
            priceChangePercent: 9.5,
            history4Weeks: [6400, 6700, 7000, 7200],
            marketStatus: "bullish",
            harvestAdvice: "Juicy table varieties are highly priced in metropolitan spots. Use clean wooden straw boxes.",
            hindiHarvestAdvice: "चिन्नरसालु रसीला आम की मांग बहुत ऊंची है। फलों को चोट से बचाने के लिए पुआल की पैकिंग करें।",
            teluguHarvestAdvice: "రసాల మామిడి రకానికి నగరాల్లో మంచి గిరాకీ ఉంది. కాయలపై గాట్లు పడకుండా ఎండు గడ్డి పెట్టండి."
          }
        ];

      case "Prakasam":
        return [
          {
            cropName: "FCV Tobacco",
            localCropName: getLabel("एफ़सीवी तंबाकू", "एफसीवी सूखी पत्ती तंबाकू", "FCV పొగాకు ఆకులు"),
            unit: getLabel("Kg", "किलोग्राम", "కిలో"),
            currentPrice: 185,
            priceChangePercent: 4.1,
            history4Weeks: [174, 178, 182, 185],
            marketStatus: "bullish",
            harvestAdvice: "Flue-Cured Virginia (FCV) auction platforms in Ongole are picking high grade lots actively.",
            hindiHarvestAdvice: "ओंगोल के तंबाकू बोर्ड नीलामी मंचों पर FCV पत्तों की बढ़िया नकद खरीद चल रही है।",
            teluguHarvestAdvice: "ఒంగోలు వేలం కేంద్రాలలో మంచి రంగు పొగాకు ఆకులకు గరిష్ట ధర లభిస్తోంది."
          },
          {
            cropName: "Extra Long Cotton",
            localCropName: getLabel("अति लंबा कपास", "कपास एक्स्ट्रा लॉन्ग", "పత్తి (సూపర్ లాంగ్)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7300,
            priceChangePercent: 1.5,
            history4Weeks: [7100, 7180, 7240, 7300],
            marketStatus: "stable",
            harvestAdvice: "Traditional cotton ginning hubs are buying regular lots. Avoid rain dampening under transit.",
            hindiHarvestAdvice: "कपास मिलों की मांग स्थिर है। परिवहन के दौरान त्रिपाल से अच्छे से ढकें।",
            teluguHarvestAdvice: "పత్తి కొనుగోళ్లు నిలకడగా ఉన్నాయి. రవాణాలో పత్తి తడవకుండా తార్పాలిన్ కప్పండి."
          }
        ];

      case "Nizamabad":
        return [
          {
            cropName: "Turmeric Fingertips",
            localCropName: getLabel("निजामाबाद हल्दी", "हल्दी निजामाबाद फिंगर्स", "నిజామాబాద్ పసుపు కొమ్ములు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 13800,
            priceChangePercent: 10.2,
            history4Weeks: [12100, 12800, 13400, 13800],
            marketStatus: "bullish",
            harvestAdvice: "Nizamabad famous turmeric yards are witnessing intense premium spikes. Dry up to 9% moisture.",
            hindiHarvestAdvice: "हल्दी मंडी में ऐतिहासिक उछाल आया है। अच्छी वैज्ञानिक पॉलिशिंग करके ही माल मंडी लाएं।",
            teluguHarvestAdvice: "నిజామాబాద్ పసుపు మార్కెట్ లో మునుపెన్నడూ లేని రికార్డు ధర లభిస్తోంది. పాలిషింగ్ బాగా చేయండి."
          },
          {
            cropName: "Telangana Sona Paddy",
            localCropName: getLabel("तेलंगाना सोना धान", "धान तेलंगाना मसूरी", "తెలంగాణ సోనా వరి రకం"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2350,
            priceChangePercent: 1.4,
            history4Weeks: [2280, 2310, 2330, 2350],
            marketStatus: "stable",
            harvestAdvice: "Fine grain variety has stable demand from local rice mill coops. Run thorough winnowing.",
            hindiHarvestAdvice: "बारीक तेलंगाना धान की उठाव दर अच्छी है। अच्छी सफाई के बाद ही मंडी लाएं।",
            teluguHarvestAdvice: "తెలంగాణ సోనా రకానికి మద్దతు ధరతో మిల్లులు సక్రమంగా కొంటున్నాయి. తాలు లేకుండా ఒలిపించండి."
          }
        ];

      case "Adilabad":
        return [
          {
            cropName: "Deep-Tex Cotton",
            localCropName: getLabel("आदिलाबाद कपास", "कपास आदिलाबाद देसी", "ఆదిలాబాద్ కాటన్ పత్తి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 7400,
            priceChangePercent: 4.2,
            history4Weeks: [6980, 7110, 7260, 7400],
            marketStatus: "bullish",
            harvestAdvice: "Excellent fiber strength from deep black clay. Sort and grade carefully for top market bracket.",
            hindiHarvestAdvice: "काली मिट्टी के कपास की चमक बढ़िया है। ग्रेडिंग करके ही लाएं उत्तम दाम मिलेंगे।",
            teluguHarvestAdvice: "నల్లరేగడి నేలల పత్తి నార బలంగా ఉంది. గ్రేడింగ్ సరిగ్గా చేస్తే అధిక ధర సులభం."
          },
          {
            cropName: "Yellow Soybean",
            localCropName: getLabel("सोयाबीन पीला", "सोयाबीन पीला दाना", "పసుపు సోయాబీన్"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 4420,
            priceChangePercent: 1.8,
            history4Weeks: [4290, 4340, 4380, 4420],
            marketStatus: "stable",
            harvestAdvice: "Soya-crushers in central hubs are purchasing stock actively. Restrict weeds during harvest.",
            hindiHarvestAdvice: "सोया तेल मिलों से स्थिर उठाव है। बीज को घास-फूस रहित साफ़ करके पैक करें।",
            teluguHarvestAdvice: "ఆయిల్ మిల్లుల నుంచి స్థిరంగా కొంటున్నారు. విత్తనాలలో గడ్డి కలుపు లేకుండా ఆరబెట్టండి."
          }
        ];

      case "Karimnagar":
        return [
          {
            cropName: "Fine Sona Paddy",
            localCropName: getLabel("करीमनगर सोना धान", "बारीक धान (करीमनगर)", "కరీంనగర్ సన్న వరి రకం"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2320,
            priceChangePercent: 1.0,
            history4Weeks: [2270, 2290, 2305, 2320],
            marketStatus: "stable",
            harvestAdvice: "Steady supply under SRI practices. Verify husk separation status before load trucks.",
            hindiHarvestAdvice: "एसआरआई विधि वाले महीन धान की सरकारी केंद्रों पर स्थिर दर है।",
            teluguHarvestAdvice: "శ్రీ సాగు వరి రకాలకు మంచి డిమాండ్ ఉంది. కొనుగోలు కేంద్రాలలో తూకం సక్రమంగా వేస్తున్నారు."
          },
          {
            cropName: "Karimnagar Maize",
            localCropName: getLabel("मक्का पीला", "मक्का करीमनगर हाइब्रिड", "కరీంనగర్ పసుపు మొక్కజొన్న"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2090,
            priceChangePercent: -0.8,
            history4Weeks: [2140, 2120, 2100, 2090],
            marketStatus: "bearish",
            harvestAdvice: "Heavy unseasonal rain arrivals are cooling spot bids. Avoid harvesting during wet spells.",
            hindiHarvestAdvice: "बेमौसमी बारिश से मक्के में नमी की चिंता। खेतों में कटी बालियों को गीला न होने दें।",
            teluguHarvestAdvice: "అకాల వర్షాల వల్ల తేమ పెరిగి రేట్ తగ్గింది. పంట కళ్లాల వద్ద నీరు నిల్వ లేకుండా చూసుకోండి."
          }
        ];

      case "Mahabubnagar":
        return [
          {
            cropName: "Kharif Groundnut",
            localCropName: getLabel("खरीफ मूंगफली", "मूंगफली देशी खरीफ", "మహబూబ్‌నగర్ వేరుశనగ"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 6900,
            priceChangePercent: 3.1,
            history4Weeks: [6500, 6650, 6780, 6900],
            marketStatus: "bullish",
            harvestAdvice: "High local demand from nearby hydra oil-expellers in Jadcherla. Dry the pods fully.",
            hindiHarvestAdvice: "जदचेरला तेल मिलों से मूंगफली की जबरदस्त मांग। कंद को धूप में ३ दिन सुखाना जरूरी है।",
            teluguHarvestAdvice: "జడ్చర్ల పరిసరాల నూనె మిల్లుల నుంచి వేరుశనగకు పోటీ ఉంది. 3 రోజులు కాయలను ఎండబెట్టండి."
          },
          {
            cropName: "Red Gram (Pigeon Pea)",
            localCropName: getLabel("अरहर (लाल चना)", "अरहर दाल दाना", "కందులు (Red Gram)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 8300,
            priceChangePercent: 5.6,
            history4Weeks: [7600, 7850, 8100, 8300],
            marketStatus: "bullish",
            harvestAdvice: "Severe pulse shortfalls are pushing prices. Grade big grains to secure maximum export premium.",
            hindiHarvestAdvice: "दालों की कमी से अरहर के भाव रिकॉर्ड स्तर पर। मोटे दानों को अलग कर पैकेट करें।",
            teluguHarvestAdvice: "మార్కెట్ లో కందుల ధర కొండెక్కుతోంది. లావు గింజలను సాఫ్ట్ చేసి అమ్మితే మంచి రేట్."
          }
        ];

      case "Nalgonda":
        return [
          {
            cropName: "Mosambi Sweet Lime",
            localCropName: getLabel("नालगोंडा मौसंबी", "नालगोंडा मीठा नींबू", "నల్గొండ బత్తాయి పండ్లు"),
            unit: getLabel("Ton", "टन", "టన్ను"),
            currentPrice: 44000,
            priceChangePercent: 6.8,
            history4Weeks: [39800, 41500, 42800, 44000],
            marketStatus: "bullish",
            harvestAdvice: "Nalgonda citrus orchards are yielding premium high-juice varieties. Grade by weight.",
            hindiHarvestAdvice: "गर्मी में नालगोंडा मौसंबी की भारी मांग। फलों को वजन और चमक के आधार पर छांटें।",
            teluguHarvestAdvice: "నల్గొండ బత్తాయికి రుతుపవనాల ముందు విపరీతమైన గిరాకీ ఉంది. కాయల పరిమాణం బట్టి గ్రేడింగ్ చేయండి."
          },
          {
            cropName: "Local Samba Paddy",
            localCropName: getLabel("सोन शकर धान", "सांबा धान (नालगोंडा)", "నల్గొండ సాంబ వరి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2290,
            priceChangePercent: 0.8,
            history4Weeks: [2240, 2260, 2275, 2290],
            marketStatus: "stable",
            harvestAdvice: "Steady procurement under state government cooperative limits. Avoid broker commissions.",
            hindiHarvestAdvice: "सरकारी समितियों द्वारा धान की खरीद जारी। दलालों से बचें और सहकारी बैंक पर्ची लें।",
            teluguHarvestAdvice: "ప్రభుత్వ ఐకెపి కేంద్రాలు స్థిరంగా కొంటున్నాయి. దళారుల ప్రమేయం లేకుండా ఐకెపిలోనే అమ్మండి."
          }
        ];

      case "Khammam":
        return [
          {
            cropName: "Khammam Dry Red Chilli",
            localCropName: getLabel("खम्मम सूखी मिर्च", "खम्मम तीखी लाल मिर्च", "ఖమ్మం ఎండు మిరపకాయలు"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 18900,
            priceChangePercent: 4.8,
            history4Weeks: [17500, 18100, 18550, 18900],
            marketStatus: "bullish",
            harvestAdvice: "High color values (ASTA specs) are catching heavy exporter attention. Avoid morning dews.",
            hindiHarvestAdvice: "गहरे तीखेपन और रंग के कारण निर्यात मांग मजबूत। ओस के समय मिर्च को ढककर रखें।",
            teluguHarvestAdvice: "అధిక రంగు, ఘాటు కలిగిన ఖమ్మం మిర్చికి ఎగుమతుల గిరాకీ బాగుంది. మంచు తగలకుండా ప్లాస్టిక్ కప్పండి."
          },
          {
            cropName: "BPT Paddy Variety",
            localCropName: getLabel("बीपीटी धान", "महीन बीपीटी मसूरी", "ఖమ్మం BPT సన్న వరి"),
            unit: getLabel("Quintal", "क्विंटal", "క్వింటాల్"),
            currentPrice: 2340,
            priceChangePercent: 1.2,
            history4Weeks: [2280, 2300, 2320, 2340],
            marketStatus: "stable",
            harvestAdvice: "Millers are offering good rates for dry straw bundles. Mow close to the ground.",
            hindiHarvestAdvice: "महीना धान की अच्छी मांग बनी हुई है। सुखाने की क्रिया छायादार पक्के फर्श पर करें।",
            teluguHarvestAdvice: "సన్న రకం బియ్యానికి డిమాండ్ స్థిరంగా ఉంది. పంట కోసిన తర్వాత పొడిగా ఉండేలా చూసుకోండి."
          }
        ];

      case "Medak":
        return [
          {
            cropName: "Hybrid Yellow Maize",
            localCropName: getLabel("हाइब्रिड पीला मक्का", "मक्का मेडक हाइब्रिड", "మెదక్ పసుపు మొక్కజొన్న"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2110,
            priceChangePercent: 1.1,
            history4Weeks: [2050, 2075, 2095, 2110],
            marketStatus: "stable",
            harvestAdvice: "Starch processors from nearby industrial estates are buying actively. Keep moisture tight.",
            hindiHarvestAdvice: "औद्योगिक मक्का मिलों से अच्छी मांग आ रही है। नमी को हमेशा १४% से कम रखें।",
            teluguHarvestAdvice: "స్టార్చ్ తయారీ పరిశ్రమలు కొనుగోళ్లు పెంచాయి. తేమ శాతం 14% మించకుండా గింజలు పోయండి."
          },
          {
            cropName: "Medak Sugarcane",
            localCropName: getLabel("मेडक गन्ना", "गन्ना (मेडक)", "మెదక్ చెరకు రకం"),
            unit: getLabel("Quintal (SAP)", "सरकारी गन्ना दर", "క్వింటాల్ (SAP రేట్)"),
            currentPrice: 370,
            priceChangePercent: 0.0,
            history4Weeks: [370, 370, 370, 370],
            marketStatus: "stable",
            harvestAdvice: "Cooperative factory cane crush is active. Keep transport timelines strict under 24 hours.",
            hindiHarvestAdvice: "गन्ना तौल नियमित रूप से जारी है। पर्ची मिलने के तुरंत बाद गन्ने की छिलाई कर भेजें।",
            teluguHarvestAdvice: "చక్కెర మిల్లుల తూకం క్రమబద్ధంగా జరుగుతోంది. తోలిక రోజే కటింగ్ చేసి పంపడం లాభదాయకం."
          }
        ];

      case "Rangareddy":
        return [
          {
            cropName: "Greenhouse Tomatoes",
            localCropName: getLabel("पॉलीहाउस टमाटर", "पॉलीहाउस टमाटर", "రంగారెడ్డి గ్రీన్ హౌస్ టమోటా"),
            unit: getLabel("Crate (25kg)", "क्रेट (२५ किलो)", "క్రేట్ (25 కేజీలు)"),
            currentPrice: 1550,
            priceChangePercent: 8.5,
            history4Weeks: [1360, 1420, 1490, 1550],
            marketStatus: "bullish",
            harvestAdvice: "Hyderabad metropolis demands are surging. Deliver early morning direct to wholesale hubs.",
            hindiHarvestAdvice: "हैदराबाद शहर की मांग के कारण रेट्स बेहतरीन। सुबह जल्दी मंडी पहुंच सुरक्षित करें।",
            teluguHarvestAdvice: "హైదరాబాద్ నగర అవసరాల దృష్ట్యా ధరలు బాగున్నాయి. ఉదయమే హోల్‌సేల్ మార్కెట్‌కు తరలించండి."
          },
          {
            cropName: "Fresh Ridge Gourd (Beerakaya)",
            localCropName: getLabel("तोरई (देशी)", "तोरई नवल", "బీరకాయ (Ridge Gourd)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 2200,
            priceChangePercent: 5.4,
            history4Weeks: [2010, 2080, 2140, 2200],
            marketStatus: "bullish",
            harvestAdvice: "High local demand. Harvest at tender pre-fibrous stage. Pack in damp gunny wraps.",
            hindiHarvestAdvice: "देशी तोरई की अच्छी मांग। रेशे बनने से पहले कोमल अवस्था में ही तुड़ाई करें।",
            teluguHarvestAdvice: "బీరకాయకు కొనుగోళ్లు బాగున్నాయి. పీచు రాక ముందే లేత దశలోనే కోసి మార్కెట్‌కు తరలించండి."
          }
        ];

      case "Lucknow":
      default:
        return [
          {
            cropName: "Sugarcane (Co-0238)",
            localCropName: getLabel("गन्ना (Co-0238)", "गन्ना (०२३८ किस्म)", "చెరకు (Co-0238 రకం)"),
            unit: getLabel("Quintal (SAP)", "क्विंटल (SAP सरकारी दर)", "క్వింటాల్ (SAP రేట్)"),
            currentPrice: 375,
            priceChangePercent: 0.0,
            history4Weeks: [375, 375, 375, 375],
            marketStatus: "stable",
            harvestAdvice: "Sugar division state-guaranteed prices (SAP) are active and safe. Mill receipts are paid direct to bank accounts within 14 days.",
            hindiHarvestAdvice: "उत्तर प्रदेश सरकार द्वारा घोषित गन्ने के दाम १००% सुरक्षित और स्थिर हैं। गन्ने की कटाई के तुरंत २४ घंटे के भीतर तौल कूपन प्राप्त करें।",
            teluguHarvestAdvice: "ప్రభుత్వ మద్దతు ధరతో చెరకు బిల్లులు 14 రోజుల్లో నేరుగా మీ బ్యాంక్ ఖాతాల్లో జమవుతాయి. చెరకు కొట్టిన వెంటనే మిల్లుకు రవాణా చేయండి."
          },
          {
            cropName: "Dussehri Mango",
            localCropName: getLabel("दशहरी आम (ग्रेड-ए)", "दशहरी आम (मलिहाबाद)", "దశేరి మామిడి"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 4800,
            priceChangePercent: 11.2,
            history4Weeks: [4100, 4300, 4550, 4800],
            marketStatus: "bullish",
            harvestAdvice: "Malihabadi mango season is peaking. Grade-A fruits are fetching intense premium rates in Delhi & Middle east exports.",
            hindiHarvestAdvice: "मलिहाबादी दशहरी आम का सीजन अपने चरम पर है। फलों की अच्छी छंटाई करें; जैविक पैक वाले बॉक्स मुंबई और दिल्ली मंडियों में दोगुना दाम पा रहे हैं।",
            teluguHarvestAdvice: "మామిడి సీజన్ ఊపందుకుంది. గ్రేడ్-ఎ దశేరి కాయలకు హైదరాబాద్, ఢిల్లీ మార్కెట్లలో అత్యధిక గిరాకీ ఉంది."
          },
          {
            cropName: "Potato (Kufri Bahar)",
            localCropName: getLabel("आलू (कुफरी बहार)", "आलू (कुफरी गोल)", "బంగాళาదుంప (కుఫ్రి బహార్)"),
            unit: getLabel("Quintal", "क्विंटल", "క్వింటాల్"),
            currentPrice: 1320,
            priceChangePercent: -3.8,
            history4Weeks: [1420, 1380, 1350, 1320],
            marketStatus: "bearish",
            harvestAdvice: "High storage stock holding triggers price saturation. Avoid urgent panic selling; prefer storing inside cooling chambers to sell in October.",
            hindiHarvestAdvice: "शीत गृह (कोल स्टोरेज) पट्टे भरे होने के कारण मंडियों में दाम कम है। घबराकर न बेचें; आलू को कोल्ड स्टोर बांड में सुरक्षित रखना अधिक उचित रहेगा।",
            teluguHarvestAdvice: "మార్కెట్ వద్ద కోల్డ్ స్టోరేజీలు నిండిపోవడం వల్ల ధరలు పడిపోయాయి. కంగారుపడి తక్కువ ధరకు అమ్మకుండా అక్టోబర్ వరకు ఆపడం మేలు."
          }
        ];
    }
  };

  const rawCropsData = getCropMarketData(selectedZone.district);
  
  // Filter crops if user has specified primary crops and toggle is enabled
  const filteredCropsData = (primaryCrops && primaryCrops.length > 0 && filterByPrimary)
    ? rawCropsData.filter(crop => 
        primaryCrops.some(pc => 
          crop.cropName.toLowerCase().includes(pc.toLowerCase()) ||
          (crop.localCropName && crop.localCropName.toLowerCase().includes(pc.toLowerCase()))
        )
      )
    : rawCropsData;

  const cropsData = filteredCropsData.length > 0 ? filteredCropsData : rawCropsData;
  
  // Guard selectedCropIndex from exceeding limits of current filtered slice
  const safeCropIndex = selectedCropIndex >= cropsData.length ? 0 : selectedCropIndex;
  const activeCrop = cropsData[safeCropIndex] || cropsData[0] || rawCropsData[0];

  // Helper to draw clean visual representation of weekly trends
  const renderMiniChart = (history: number[], status: "bullish" | "stable" | "bearish") => {
    const maxVal = Math.max(...history);
    const minVal = Math.min(...history);
    const diff = maxVal - minVal || 1;

    let barColor = "bg-emerald-500 hover:bg-emerald-600";
    if (status === "bearish") barColor = "bg-rose-500 hover:bg-rose-600";
    if (status === "stable") barColor = "bg-slate-400 hover:bg-slate-500";

    return (
      <div className="flex items-end justify-between h-32 w-full bg-slate-50/70 rounded-2xl border border-slate-100 p-5 mt-3 relative overflow-hidden">
        <span className="absolute bottom-1 left-2.5 text-[8px] font-bold font-mono text-slate-400 uppercase tracking-widest leading-none">
          4-Week Mandi Price Progress
        </span>
        
        {history.map((price, idx) => {
          // Calculate height percent
          const heightPercent = 20 + ((price - minVal) / diff) * 65; // Scale cleanly between 20% and 85% height
          return (
            <div key={idx} className="flex flex-col items-center flex-1 space-y-1.5 h-full justify-end z-10 group px-2">
              <span className="text-[10px] font-bold text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-1.5 py-0.5 rounded border border-slate-100 shadow-sm absolute -translate-y-8 font-mono">
                ₹{price}
              </span>
              <div 
                className={`w-full rounded-md transition-all shadow-sm ${barColor}`} 
                style={{ height: `${heightPercent}%` }} 
              />
              <span className="text-[10px] font-bold font-mono text-slate-400 uppercase">
                {getLabel(`Wk ${idx + 1}`, `सप्ताह ${idx + 1}`, `వారం ${idx + 1}`)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div id="market-price-tracker-section" className="bg-white rounded-3xl border border-slate-200/85 p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-extrabold text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full shrink-0">
              📍 {selectedZone.district} Mandi Yard
            </span>
            <span className="text-[10px] font-mono font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              REALTIME SPOT DATA
            </span>
          </div>
          
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 mt-1">
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Scale className="w-4 h-4" />
            </span>
            {getLabel("Mandi Market Prices & Harvest Advisor", "मंडी भाव और फसल कटाई सलाहकार", "మార్కెట్ ధరలు - గిరాకీ సలహాదారు")}
          </h3>
          <p className="text-[11px] text-slate-500 leading-normal font-sans">
            {getLabel(
              "Track weekly trends to determine if you should hold or immediately harvest crop yields.",
              "यह जानने के लिए साप्ताहिक मूल्य रुझान देखें कि आपको फसल काटनी चाहिए या रोकनी चाहिए।",
              "పంట కొయ్యడం లేదా నిల్వ చేయడం గురించి సరైన నిర్ణయాలు తీసుకోవడానికి స్థానిక ధరల సరళిని పరిశీలింపవచ్చు."
            )}
          </p>
        </div>
        
        {/* Mandi specific separate location selection dropdown with GPS button */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-2 rounded-2xl self-start md:self-center">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold text-slate-700 leading-none">
              {getLabel("Market Location", "मंडी स्थान", "మార్కెట్ లొకేషన్")}
            </p>
            <p className="text-[8px] text-slate-400 font-medium mt-0.5">
              {getLabel("Independent of Weather", "मौसम से अलग स्वतंत्र", "వాతావరణంతో సంబంధం లేకుండా")}
            </p>
          </div>
          
          <select
            id="market-zone-dropdown"
            value={selectedZone.district}
            onChange={handleMandiZoneSelect}
            className="text-xs font-semibold border border-slate-200 rounded-xl p-1.5 bg-white text-slate-700 outline-none focus:border-emerald-500 cursor-pointer max-w-[150px] sm:max-w-[180px] shadow-xs"
          >
            {AGRICULTURAL_ZONES.map((zone) => (
              <option key={zone.district} value={zone.district}>
                📍 {zone.district}, {zone.state}
              </option>
            ))}
          </select>

          <button
            id="gps-mandi-location-button"
            type="button"
            onClick={handleDetectMarketLocation}
            disabled={isLoadingLocation}
            className="p-1.5 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={getLabel("Detect Nearest Mandi Location", "निकटतम मंडी खोजें", "సమీప మార్కెట్ గుర్తించండి")}
          >
            <Locate className={`w-4 h-4 ${isLoadingLocation ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* GPS Status Banner */}
      {locationStatus && (
        <div 
          id="market-gps-status-banner"
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
            id="close-market-gps-status-btn"
            type="button"
            onClick={() => setLocationStatus(null)}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Primary Crops Filter Banner / Trigger Toggle */}
      {primaryCrops && primaryCrops.length > 0 && (
        <div className="bg-emerald-50/55 border border-emerald-100/70 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in select-none">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl mt-0.5 sm:mt-0 shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            </span>
            <div>
              <p className="font-extrabold text-slate-900 leading-none">
                {getLabel("Mandi Filter: Tailored to your crops", "मंडी छननी: पसंदीदा फसलों द्वारा फ़िल्टर", "పంటల ఫిల్టర్: మీ అనుకూల పంటలు")}
              </p>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                {getLabel("Showing prices tailored to your selected primary crops: ", "आपकी चुनी हुई मुख्य फसलों के भाव दिखाए जा रहे हैं: ", "మీరు ఎంచుకున్న ప్రాథమిక పంటల ధరలు మాత్రమే చూపుతోంది: ")}
                <span className="font-extrabold text-emerald-700 bg-emerald-100/40 px-1.5 py-0.5 rounded-md border border-emerald-100">{primaryCrops.join(", ")}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterByPrimary(!filterByPrimary);
              setSelectedCropIndex(0); // Reset index on filter toggle
            }}
            className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              filterByPrimary
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {filterByPrimary 
              ? getLabel("Show All District Crops", "सभी जिला फसलें दिखाएं", "అన్ని పంటల ధరలు చూపు")
              : getLabel("Filter My Crops Only", "केवल मेरी फसल फ़िल्टर करें", "నా పంటలు మాత్రమే చూపు")
            }
          </button>
        </div>
      )}

      {/* Selectors grid - Horizontal list of crop buttons in selected district */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cropsData.map((crop, idx) => {
          const isActive = idx === safeCropIndex;
          const isUp = crop.priceChangePercent >= 0;

          return (
            <button
              key={crop.cropName}
              id={`crop-price-select-${idx}-btn`}
              onClick={() => setSelectedCropIndex(idx)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${
                isActive 
                  ? "bg-slate-950 border-slate-950 text-white shadow-md shadow-slate-900/10"
                  : "bg-slate-50/50 hover:bg-slate-50 border-slate-250 text-slate-800 hover:border-slate-300"
              }`}
            >
              <div className="space-y-1 truncate pr-2">
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {crop.cropName}
                </span>
                <span className="block text-xs font-extrabold truncate">
                  {crop.localCropName}
                </span>
                <span className={`block text-lg font-bold font-mono tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>
                  ₹{crop.currentPrice} <span className="text-xs font-medium text-slate-400">/{crop.unit}</span>
                </span>
              </div>

              <div className="flex flex-col items-end shrink-0 space-y-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-0.5 ${
                  isUp 
                    ? "bg-emerald-100 text-emerald-800" 
                    : "bg-rose-100 text-rose-800"
                }`}>
                  {isUp ? <TrendingUp className="w-3 h-3 shrink-0" /> : <TrendingDown className="w-3 h-3 shrink-0" />}
                  {isUp ? "+" : ""}{crop.priceChangePercent}%
                </span>
                
                <span className={`text-[9px] uppercase font-bold tracking-tight font-mono ${
                  crop.marketStatus === "bullish" 
                    ? "text-emerald-400" 
                    : crop.marketStatus === "bearish" 
                    ? "text-rose-400" 
                    : "text-slate-400"
                }`}>
                  {crop.marketStatus}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Analysis card - Render detailed chart & Harvest Advice */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 border border-slate-150 rounded-2xl p-4 md:p-5">
        
        {/* Left side: Visual Chart (occupies 3/5 on large, is stacked on mobile) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-extrabold uppercase tracking-wide text-slate-400 font-sans">
              📈 {getLabel("Price Progression Trend", "मूल्य विकास चार्ट", "ధరల ఎదుగుదల గ్రాఫ్")}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
              Spot Market: INR per {activeCrop.unit}
            </span>
          </div>

          {renderMiniChart(activeCrop.history4Weeks, activeCrop.marketStatus)}

          <div className="bg-slate-50 p-3 rounded-xl text-[10px] text-slate-500 flex items-center gap-2 mt-2 border border-slate-100">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {getLabel(
                "Our predictive trends correspond directly with localized harvest profiles, MSP government mandates, and rain alerts.",
                "हमारे पूवार्नुमानित रुझान कटाई चक्र, सरकारी न्यूनतम समर्थन मूल्य तथा मौसम की चेतावनी प्रणाली से सीधे समन्वयित हैं।",
                "ఈ ధరల సరళి పంట చేతికొచ్చే సమయం, ప్రభుత్వ మద్దతు ధర మరియు వర్షపాత సమాచారం ఆధారంగా అంచనా వేయబడింది."
              )}
            </span>
          </div>
        </div>

        {/* Right side: Actionable harvest advice (occupies 2/5 on large) */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <span className="inline-block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              🌾 Harvest Advice Indicator
            </span>

            {/* Recommendation badge blocks */}
            {activeCrop.marketStatus === "bullish" ? (
              <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-900 font-extrabold text-xs uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                  <h4>🟢 {getLabel("Optimal Sells & Dispatch", "तेज मंडी बिक्री सलाह", "అధిక లాభాలు - కొయుటకు సరైన సమయం")}</h4>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {getLabel(
                    "Spot prices are peaking due to strong buyers demand. Harvest mature crops immediately to capture high margins.",
                    "सशक्त खरीदारों की मांग के कारण हाजिर कीमतें शिखर पर हैं। उच्च मुनाफा कमाने के लिए पकी फसलों की तुरंत कटाई कर मंडी भेजें।",
                    "ప్రస్తుత ధరలు అత్యధికంగా ఉన్నాయి. పంట కోత పూర్తి చేసి వెంటనే విక్రయించడం ద్వారా అధిక లాభాలు పొందవచ్చు."
                  )}
                </p>
              </div>
            ) : activeCrop.marketStatus === "bearish" ? (
              <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-rose-900 font-extrabold text-xs uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full shrink-0" />
                  <h4>🔴 {getLabel("Hold & Cold Storage", "भंडारण करें (अभी न बेचें)", "పంట నిల్వ చేయుట మంచిది (Hold)")}</h4>
                </div>
                <p className="text-[11px] text-rose-800">
                  {getLabel(
                    "Supply saturation is driving spot prices lower. If crop moisture allows, store the yields inside cold storage facilities.",
                    "बाजार में अति-आवक के कारण हाजिर कीमतें गिर रही हैं। नुकसान से बचने के लिए फसल को कोल्ड स्टोरेज में सुरक्षित रखें।",
                    "మార్కెట్లో పంట నిల్వలు పెరగడం వల్ల ధరలు తగ్గాయి. తడి తగలకుండా పటిష్టమైన కోల్డ్ స్టోరేజీల్లో నిల్వ ఉంచడం లాభదాయకం."
                  )}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-900 font-extrabold text-xs uppercase tracking-wide">
                  <span className="w-2.5 h-2.5 bg-slate-400 rounded-full shrink-0" />
                  <h4>🟡 {getLabel("Stable / Gradual Sale Plan", "सामान्य नियमित बिक्री", "మార్కెట్ నిలకడగా ఉంది (Stable)")}</h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  {getLabel(
                    "Price is stable. Deliver consistent moderate batches to mandi yard. Avoid storage decay by liquidating half of mature produce.",
                    "कीमतें स्थिर बनी हुई हैं। मंडी में धीरे-धीरे नियमित अंतराल पर फसल बेचें ताकि भंडारण सड़न की समस्या से बचा जा सके।",
                    "ధరలు చాలా నిలకడగా ఉన్నాయి. కోత కోసిన పంటను భాగాలుగా అమ్ముకోవడం ద్వారా తదుపరి సాగు ఖర్చులకు వాడుకోవచ్చు."
                  )}
                </p>
              </div>
            )}

            {/* Localized detailed agronomic wisdom */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                Agronomic Mandi Context:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-semibold italic">
                "{getLabel(activeCrop.harvestAdvice, activeCrop.hindiHarvestAdvice, activeCrop.teluguHarvestAdvice)}"
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold">
            <span>District: {selectedZone.district}</span>
            <span>Est. Arrival Count: 1.2k Metric Tons</span>
          </div>
        </div>

      </div>

      {/* 📰 AI Mandi News Bulletin Card (Custom Pre-filtered with primary crops) */}
      <div id="ai-market-news-card" className="bg-gradient-to-r from-emerald-50/20 to-teal-50/20 rounded-2xl border border-emerald-100 p-5 space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100/50 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-emerald-100/70 text-emerald-800 rounded-xl">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-pulse shrink-0" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                {getLabel("AI Regional Mandi News Bulletin", "एआई क्षेत्रीय मंडी समाचार बुलेटिन", "AI వ్యవసాయ ప్రాంతీయ వార్తా బులెటిన్")}
                <span className="text-[8px] bg-emerald-600 text-white font-mono px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest shadow-xs">Gemini Live</span>
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-none mt-1">
                {getLabel("Real-time pricing trends & strategy customized to your crops", "आपकी पसंदीदा फसलों के अनुसार नवीनतम बाजार भाव और रणनीति", "మీ ప్రాధాన్య పంటలకు అనుగుణంగా మార్కెట్ ధరలు & అంచనాలు")}
              </p>
            </div>
          </div>
          {newsSource && (
            <span id="news-source-badge" className="self-start sm:self-center text-[9px] font-mono font-bold text-emerald-850 bg-emerald-100/40 border border-emerald-150 px-2.5 py-1 rounded-full shrink-0">
              {newsSource}
            </span>
          )}
        </div>

        {isNewsLoading ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border-3 border-emerald-200 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-3 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-500 font-mono text-[10px] animate-pulse">
              Synthesizing regional mandi reports and crop profiles...
            </p>
          </div>
        ) : (
          <div className="markdown-body prose max-w-none text-slate-800 text-xs leading-relaxed space-y-2 pl-1 select-text">
            <ReactMarkdown>{newsReport}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Helpful harvest timing instructions card */}
      <div className="bg-slate-50 rounded-2xl border border-slate-150 p-4 md:p-5 flex items-start gap-3 text-xs leading-relaxed text-slate-600">
        <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-800 block">
            {getLabel("How to Check Optimal Harvest Moisture Levels At Home", "घर पर फसल परिपक्वता (नमी) जांचने की विधि", "ధాన్యంలో తేమ శాతాన్ని ఇంటి వద్దే సులువుగా కొలిచే పద్ధతి")}
          </strong>
          <p>
            {getLabel(
              "Take 20 random grain seeds and bite down. If they break cleanly with a sharp snapping sound, the moisture is under 14% (perfect range for storing/mandi sales). For cotton crops, lint should feel completely springy and expand instantly when released from hand pressure.",
              "२० यादृच्छिक दानों को दांतों के बीच दबाएं। यदि वे तेज कड़क ध्वनि के साथ आसानी से टूटते हैं, तो उनकी नमी १४% से कम है (भंडारण हेतु सर्वश्रेष्ठ)। कपास में नमी जांचने हेतु रुई को हाथ में दबाकर छोड़ें; यदि यह तुरंत मूल आकार में वापस आती है, तो यह बेचने के लिए तैयार है।",
              "కొన్ని గింజలను తీసుకొని నోటితో నొక్కినప్పుడు కరకరమని శబ్దం వస్తే తేమ శాతం 14% కన్నా తక్కువ ఉన్నట్లు నిర్ధారించుకోవచ్చు (రవాణాకు సిద్ధం). పత్తిని పిడికిలితో గట్టిగా నొక్కి వదిలినప్పుడు అది వెంటనే పాత రూపానికి వస్తే ఎండబెట్టడం పూర్తయినట్లే."
            )}
          </p>
        </div>
      </div>

    </div>
  );
}
