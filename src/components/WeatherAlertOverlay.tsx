import React, { useState, useEffect, useRef } from "react";
import { AgriculturalZone } from "../types";
import { AlertTriangle, CloudRain, Snowflake, Thermometer, X, ShieldCheck, HelpCircle } from "lucide-react";

interface WeatherAlertOverlayProps {
  selectedZone: AgriculturalZone;
  preferredLanguage: string;
  smsPhone: string;
  onSmsPhoneChange: (phone: string) => void;
  smsRainEnabled: boolean;
  onSmsRainToggle: (val: boolean) => void;
  smsHeatEnabled: boolean;
  onSmsHeatToggle: (val: boolean) => void;
  onTriggerTestSms: () => void;
}

interface AlertDetail {
  type: "rain" | "frost" | "heat";
  badgeText: string;
  badgeStyle: string;
  pulseColor: string;
  severity: "severity-critical" | "severity-high" | "severity-moderate";
  severityLabel: string;
  title: string;
  desc: string;
  precautions: string[];
}

export default function WeatherAlertOverlay({
  selectedZone,
  preferredLanguage,
  smsPhone,
  onSmsPhoneChange,
  smsRainEnabled,
  onSmsRainToggle,
  smsHeatEnabled,
  onSmsHeatToggle,
  onTriggerTestSms
}: WeatherAlertOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissedForZone, setIsDismissedForZone] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-re-enable alert whenever zone changes, so users can see the distinct alerts for each zone
  useEffect(() => {
    setIsDismissedForZone(null);
  }, [selectedZone.district]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  // Pre-configured hazard alerts based on District parameters
  const getAlertDetail = (district: string): AlertDetail | null => {
    switch (district) {
      case "Nagpur":
        return {
          type: "rain",
          badgeText: getLabel("🌧️ Rain / Storm Warning", "🌧️ अतिवृष्टि चेतावनी", "🌧️ తుఫాను & భారీ వర్ష హెచ్చరిక"),
          badgeStyle: "bg-amber-50 hover:bg-amber-100/80 border-amber-300 text-amber-800 shadow-amber-200/10",
          pulseColor: "bg-amber-500",
          severity: "severity-high",
          severityLabel: getLabel("High Hazard | Sowing Interruption", "उच्च जोखिम | बुवाई में बाध", "ఎక్కువ ప్రమాదం | విత్తన నిలిపివేత"),
          title: getLabel("Unseasonal Heavy Rain & Hail Alert", "असामयिक भारी वर्षा और ओला वृष्टि", "అకాల భారీ వర్షాలు మరియు వడగండ్ల వాన"),
          desc: getLabel(
            "Slow-moving low-pressure systems are pushing intense sudden convective clouds over regions of Nagpur and Vidarbha plain. Heavy waterlogging expected in standard Black Cotton soils.",
            "नागपुर और विदर्भ के क्षेत्रों में अचानक घने बादल छाने की आशंका है। काली मिट्टी में जलभराव की उच्च संभावना है जिससे फसलों को क्षति पहुँच सकती है।",
            "నాగపూర్ పరివాహక ప్రాంతాల్లో ఒకేసారి తీవ్ర స్థాయిలో మేఘాలు కమ్ముకునే ప్రభావం ఉంది. నల్ల నేలల్లో నీరు నిలిచిపోయే ప్రమాదం చాలా ఎక్కువగా ఉంది."
          ),
          precautions: [
            getLabel("Postpone active cotton and soybean manual harvesting for 48 hours.", "कपास और सोयाबीन की कटाई को ४८ घंटों के लिए टालें।", "పత్తి మరియు సోయాబీన్ పంట కోతను 48 గంటల పాటు వాయిదా వేయండి."),
            getLabel("Clear primary field exit outlets to drain stagnant water instantly.", "खेत की मेड़ से जल निकासी के रास्ते खोलें ताकि पानी जमा न हो।", "పొలంలో నీరు వెంటనే బయటకు పోయేలా కాలువ దెబ్బలు బాగు చేయండి."),
            getLabel("Keep picked cotton baskets safely inside high covered dry barns.", "कटाई की गई फसलों को गीला होने से बचाने के लिए सुरक्षित शेड में रखें।", "కోసిన పంటను తడవకుండా కాపాడటానికి గట్టి టార్పాలిన్ షీట్లతో కప్పండి.")
          ]
        };

      case "Lucknow":
        return {
          type: "rain",
          badgeText: getLabel("⛈️ Flash Flood Danger", "⛈️ मूसलाधार बारिश खतरा", "⛈️ వరద ముప్పు హెచ్చరిక"),
          badgeStyle: "bg-rose-50 hover:bg-rose-100/80 border-rose-300 text-rose-800 shadow-rose-200/10",
          pulseColor: "bg-rose-500",
          severity: "severity-critical",
          severityLabel: getLabel("CRITICAL HAZARD | FLOOD RISK", "गंभीर खतरा | बाढ़ की चेतावनी", "అత్యంత ప్రమాదకరం | వరద హెచ్చరిక"),
          title: getLabel("Monsoon Cloudburst & Runoff Surge", "मूसलाधार मानसूनी बारिश और जलभराव", "తీవ్రమైన తుఫాను రుతుపవనాల వరద ముప్పు"),
          desc: getLabel(
            "Deep fertile alluvial basins of Central Gangetic Plains are expecting extreme precipitation (>95mm). Fast surface runoff will completely submerge young sugarcane and nursery seedbeds.",
            "गंगा के मैदानी बेसिन में मूसलाधार वर्षा (>95 मिमी) होने की अत्यधिक आशंका है। निचले खेतों में गन्ने और नर्सरी पूरी तरह डूब सकते हैं।",
            "గంగా పరివాహక మైదాన ప్రాంతాల్లో ఊహించని భారీ కుండపోత వర్షం (>95 మిమీ) కురుస్తుంది. దీనివల్ల నారుమళ్లు మరియు చెరకు మొక్కలు పూర్తిగా మునిగిపోయే అవకాశం ఉంది."
          ),
          precautions: [
            getLabel("Dig immediate deep field channels to bypass river water inflow.", "नदी/नालों के पानी के प्रवेश को रोकने के लिए गहरी सुरक्षा खाइयां बनाएं।", "నది లేదా కాలువల నంచి వరద నీరు లోపలికి రాకుండా రక్షణ గట్లు వేసుకోండి."),
            getLabel("Suspend applying urea compost to prevent immediate fertilizer wash-off.", "उर्वरक को धूलने से बचाने के लिए यूरिया का छिड़काव तुरंत बंद करें।", "రసాయన ఎరువుల వాడకాన్ని పూర్తిగా నిలిపివేయండి, లేదంటే నీటి వాలుకు కొట్టుకుపోతాయి."),
            getLabel("Ensure livestock and pump motors are moved to elevated dry floors.", "पशुओं और पानी के पंपों को सुरक्षित तथा ऊंचे कंक्रीट स्थानों पर शिफ्ट करें।", "పాడి పశువులను మరియు నీటి పంపు మోటర్లను ఎత్తైన పొడి ప్రదేశాలకు తరలించండి.")
          ]
        };

      case "Bhatinda":
        return {
          type: "frost",
          badgeText: getLabel("❄️ Severe Frost Warning", "❄️ कड़ाके की ठंड (पाला) चेतावनी", "❄️ తీవ్రమైన మంచు ముప్పు"),
          badgeStyle: "bg-sky-50 hover:bg-sky-100/80 border-sky-300 text-sky-850 shadow-sky-200/10",
          pulseColor: "bg-sky-500",
          severity: "severity-high",
          severityLabel: getLabel("Severe Weather | Ground Freeze", "तीव्र पाला | पत्तियां जमने का संकट", "మంచు తుఫాన్ | ఆకులు గడ్డకట్టే ప్రమాదం"),
          title: getLabel("Midnight Radiative Frost & Freeze Hazard", "मध्यरात्रि पाला और शुष्क शीत लहर", "అర్ధరాత్రి తీవ్రమైన పొగమంచు మరియు చలిగాలులు"),
          desc: getLabel(
            "Advective arctic cold air pooling over Bhatinda and Malwa belt will cause ground temperatures to hit 1.5°C over soil levels. High damage chance for potato tubers and mustard foliage cells.",
            "पहाड़ी ठंडी हवाओं के जमाव के कारण भटिंडा में जमीनी तापमान 1.5°C तक गिर सकता है। आलू के कंदों और सरसों की पत्तियों के झुलसने का प्रबल खतरा है।",
            "కొండ ప్రాంతాల నుంచి వీస్తున్న చలిగాలుల తీవ్రత వల్ల భటిండా మైదానాల్లో రాత్రి ఉష్ణోగ్రతలు 1.5°C కి పడిపోతాయి. ఇది బంగాళాదుంప, ఆవాల పంటలకు హానికరం."
          ),
          precautions: [
            getLabel("Apply light overhead sprinkler irrigation at 11:00 PM to warm local soil.", "रात ११ बजे खेत में हल्की सिंचाई करें जिससे मिट्टी का तापमान अनुकूल बना रहे।", "రాత్రి 11 గంటల సమయంలో తేలికపాటి నీటి తడులు ఇవ్వడం వల్ల నేల ఉష్ణోగ్రత పెరుగుతుంది."),
            getLabel("Burn straw or organic waste on northern windward borders for protective warmth.", "ठंडी जंगली हवाओं की दिशा में कचरा/सूखी पुआल जलाकर गर्म धुआं पैदा करें।", "చలిగాలి వచ్చే వైపు ఎండు గడ్డితో పొగ పెట్టడం ద్వారా పొలంలో ఉష్ణోగ్రత కాపాడుకోవచ్చు."),
            getLabel("Foliar spray soluble potash to increase intercellular solute cell volume.", "पत्तियों की ताकत बढ़ाने के लिए घुलनशील पोटाश का हल्का छिड़काव करें।", "మొక్క కణజాలం దెబ్బతినకుండా ఉండేందుకు ద్రవరూప పొటాష్‌ పిచికారీ చేయండి.")
          ]
        };

      case "Chikkaballapur":
        return {
          type: "frost",
          badgeText: getLabel("🌬️ Frost & Chill Advisory", "🌬️ पाला और ओस की समस्या", "🌬️ శీతల గాయాల ముందస్తు సలహా"),
          badgeStyle: "bg-teal-50 hover:bg-teal-100/80 border-teal-300 text-teal-800 shadow-teal-200/10",
          pulseColor: "bg-teal-500",
          severity: "severity-moderate",
          severityLabel: getLabel("Moderate Advisory | Chill Injury", "सामान्य चेतावनी | पत्ती ओस आघात", "మితమైన హెచ్చరిక | చలి ప్రభావం"),
          title: getLabel("Morning Ground Dew Scald & Blight Spores", "सुबह की ओस की प्रचुरता और फफूंद प्रसार", "ఉదయం కురిసే విపరీతమైన మంచు & ఆకుమచ్చ తెగులు"),
          desc: getLabel(
            "Clear skies and high evening moisture are inducing heavy condensation and ground dew scalding over tomato crop lines. Damp conditions can trigger rapid early blight leaf spots.",
            "आसमान साफ रहने और भारी आर्द्रता के योग से टमाटर के पत्तों पर भारी ओस गिर रही है। इससे अगेती झुलसा नामक कवक रोग तेजी से फ़ैल सकता है।",
            "ఆకాశం నిర్మలంగా ఉండి సాయంత్రం వేళల్లో తేమ పెరగడం వల్ల టమోటా ఆకులపై మంచు బిందువులు పేరుకుపోయి, ఆకుమచ్చ తెగుళ్లు వేగంగా వ్యాపిస్తాయి."
          ),
          precautions: [
            getLabel("Use biodegradable plastic or dry ragi straw mulch sheets over tomato rows.", "टमाटर के पौधों के चारों ओर प्लास्टिक या रागी पुआल की मल्चिंग परत बिछाएं।", "టమోటా సాళ్ల మధ్య ప్లాస్టిక్ షీట్లు లేదా రాగి వ్యర్థాలతో మల్చింగ్ ఏర్పాటు చేయండి."),
            getLabel("Avoid overhead water spray during peak dew hours (6:00 AM - 9:00 AM).", "सुबह ६ से ९ बजे के बीच ओस के समय पत्तियों पर भारी पानी का छिड़काव न करें।", "ఉదయం 6 నుండి 9 గంటల మధ్య మంచు ఎక్కువగా ఉన్నప్పుడు నీటి పిచికారీ చేయకండి."),
            getLabel("Prepare copper oxychloride preventive solutions to use at the first sign of lesions.", "पत्तियों पर दाग दिखने पर तुरंत कॉपर ऑक्सीक्लोराइड का सुरक्षात्मक घोल डालें।", "ఆకులపై నల్లటి మచ్చలు కనిపిస్తే వెంటనే కాపర్ ఆక్సిక్లోరైడ్ పిచికారీ చేయండి.")
          ]
        };

      
      case "Guntur":
      case "Khammam":
      case "Prakasam":
        return {
          type: "heat",
          badgeText: getLabel("🔥 Hot Wind Wave Alert", "🔥 गर्म मरुस्थलीय हवा चेतावनी", "🔥 తీవ్రమైన వేడి గాలులు & ముప్పు హెచ్చరిక"),
          badgeStyle: "bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-850 shadow-orange-200/10",
          pulseColor: "bg-orange-500",
          severity: "severity-high",
          severityLabel: getLabel("Severe Wind Stress | Low Humidity", "तीव्र गर्म हवा | सूखी हवा", "అధిక వేడి | గాలిలో తేమ శాతం క్షీణత"),
          title: getLabel("Dry Hot Air Wave Warning", "शुष्क लू का प्रकोप एवं फसल झुलसन", "ఎండు మిరప తోటలకు వేడి గాలుల ప్రమాదం"),
          desc: getLabel(
            "Dry tropical land winds are pulling moisture out of Chilli pods rapidly. Evapotranspiration is extremely high. Leaf scorching and thrips populations can multiply quickly.",
            "शुष्क और गर्म हवाओं के कारण मिर्च की फलियों की नमी तेजी से उड़ रही है। कवक रोग फैलने का उचित तापमान है।",
            "వేడి పొడి గాలి తీవ్రత వల్ల మిరప తోటల్లో తామర పురుగు మరియు పేను బంక తెగుళ్లు వ్యాపించే ప్రమాదం చాలా ఎక్కువగా ఉంది."
          ),
          precautions: [
            getLabel("Foliar spray potassium compounds to lock cell moisture.", "पत्तियों को सूखने से बचाने के लिए पोटेशियम का हल्का छिड़काव करें।", "మొక్క ఆకులు ముడుచుకోకుండా పొటాషియం పిచికారీ చేయడం చాలా మంచిది."),
            getLabel("Irrigate rows post-sunset to prevent high daytime evaporation.", "वाष्पीकरण रोकने के लिए शाम के समय या रात ही सिंचाई करें।", "నీటి ఆవిరి రేటు తగ్గించడానికి సాయంత్రం వేళల్లో మాత్రమే తడులు పెట్టండి."),
            getLabel("Erect border dry-stalk wind barrier sheets instantly.", "तेज हवा रोकने के लिए मेड़ों पर सूखी पुआल की छाया करें।", "వేడి గాలిని నిరోధించడానికి సరిహద్దు గట్ల వెంబడి పొడవు కంచెలు వేసుకోండి.")
          ]
        };

      case "Kurnool":
      case "Kadapa":
      case "Mahabubnagar":
      case "Nalgonda":
        return {
          type: "heat",
          badgeText: getLabel("☀️ Severe Drought & Soil Aridity", "☀️ गंभीर जल संकट चेतावनी", "☀️ తీవ్రమైన శీతోష్ణస్థితి ఎండల హెచ్చరిక"),
          badgeStyle: "bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-850 shadow-rose-200/10",
          pulseColor: "bg-rose-500",
          severity: "severity-critical",
          severityLabel: getLabel("CRITICAL DEFICIT | DRY ARID EXTREMES", "गंभीर जल संकट | शुष्क तपन", "భూగర్భ జలాలు పడిపోవడం | తీవ్రమైన ఎండల ఎద్దడి"),
          title: getLabel("Extreme Water Deficit & Soil Heat Stress", "भीषण गर्मी एवं भूगर्भ जल गिरावट", "తీవ్రమైన ఎండల కారణంగా వేరుశనగ పంట వడిలిపోవడం"),
          desc: getLabel(
            "Arid land settings have resulted in extreme ground heat and moisture deficits. Groundnuts are highly prone to early leaf wilting and root dehydration.",
            "लगातार तापमान बढ़ने से मिट्टी की नमी शून्य प्रतिशत बची है जिससे मूंगफली के पत्ते सूख सकते हैं।",
            "తీవ్రమైన ఉష్ణోగ్రతలు మరియు ఎండల వల్ల భూమి పూర్తిగా ఎండిపోయింది. దీనివల్ల వేరుశనగ మొక్కలు వేరమ్మట ఎండిపోయే ముప్పు ఉంది."
          ),
          precautions: [
            getLabel("Operate sub-surface low-pressure drip pipes post-sunset.", "जल संचय हेतु सिर्फ सूर्य ढलने के बाद ही ड्रिप पंप चलाएं।", "నీటి ఆవిరిని అరికట్టడానికి కేవలం సాయంత్రం వేళల్లో భూగర్భ డ్రిప్ ఆన్ చేయండి."),
            getLabel("Utilize dry grass or straw mulches on active crop bases.", "नमी बचाने के लिए कटी सूखी घास से क्यारियां ढकें।", "నేలలో తేమ నిల్వ కాపాడటానికి ఎండిన గడ్డితో రక్షక కప్పడం (మల్చింగ్) చేయండి."),
            getLabel("Avoid active heavy weeding to prevent open soil moisture loss.", "मिट्टी से नमी उड़ने से रोकने के लिए इस समय गुड़ाई न करें।", "ఎండ తీవ్రత తగ్గే వరకు నేల తవ్వడం (కలుపు తీయడం) చేయకండి, లేదంటే తేమ పోతుంది.")
          ]
        };

      case "East Godavari":
      case "West Godavari":
      case "Nellore":
      case "Krishna":
      case "Srikakulam":
      case "Vizianagaram":
      case "Visakhapatnam":
        return {
          type: "rain",
          badgeText: getLabel("🌧️ Low Pressure Cyclone Alert", "🌧️ तटीय चक्रवात चेतावनी", "🌧️ తీరప్రాంత తుఫాను భారీ వర్ష హెచ్చరిక"),
          badgeStyle: "bg-teal-50 hover:bg-teal-150 border-teal-300 text-teal-800 shadow-teal-200/10",
          pulseColor: "bg-teal-500",
          severity: "severity-high",
          severityLabel: getLabel("High Wind Storm | Tidal Inflow", "भीषण आंधी तूफान | भारी वर्षा", "ఈదురు గాలులతో కూడిన వర్షాలు | కాలువలు ఉప్పొంగుట"),
          title: getLabel("Tidal Cyclone Storm & Heavy Outpour", "चक्रवात आंधी तूफान और मूसलाधार बारिश", "అల్పపీడన తుఫాను భారీ వర్షాల ముప్పు హెచ్చరిక"),
          desc: getLabel(
            "Coastal monsoon depressions are causing heavy coastal downpours and stormy wind gust lines. High threat of young paddy nursery field submergence and waterlogged roots.",
            "बंगाल की खाड़ी में बने चक्रवात से भारी तटीय वर्षा की आशंका है। निचले खेतों में जलभराव की उच्च संभावना है।",
            "బంగాళాఖాతంలో ఏర్పడిన అల్పపీడనం వల్ల తీరప్రాంత జిల్లాల్లో బలమైన ఈదురు గాలులతో భారీ వర్షాలు కురుస్తాయి. వరి నారుమళ్లు మునిగే ప్రమాదం ఉంది."
          ),
          precautions: [
            getLabel("Reinforce delta outlet canal bunds to prevent backup rivers.", "नहरों का पानी खेत में आने से रोकने के लिए मिट्टी की मजबूत मेड़ बनाएं।", "కాలువల నీరు పొలంలోకి రాకుండా సరిహద్దు గట్లు తవ్వి బహు భద్రంగా ఉంచండి."),
            getLabel("Postpone manual crop picking and fertilizer actions.", "कटाई और रासायनिक खाद के छिड़काव को तुरंत टालें।", "వరి పంట కోత మరియు రసాయన ఎరువుల చల్లడం తాత్కాలికంగా నిలిపివేయండి."),
            getLabel("Ensure cattle are safely put in elevated concrete shelters.", "पशुओं को बाढ़ से सुरक्षित ऊंचे पक्के स्थानों पर बांधें।", "పాడి పశువులను సురక్షితమైన ఎత్తైన ఆవరణలో భద్రపరచండి.")
          ]
        };

      case "Nizamabad":
      case "Karimnagar":
      case "Adilabad":
      case "Medak":
      case "Rangareddy":
        return {
          type: "heat",
          badgeText: getLabel("⚠️ Soil Moisture Stress Alert", "⚠️ मिट्टी में नमी संकट चेतावनी", "⚠️ నేలలో తేమ కొరత హెచ్చరిక"),
          badgeStyle: "bg-yellow-50 hover:bg-yellow-100 border-yellow-300 text-yellow-800 shadow-yellow-250/10",
          pulseColor: "bg-yellow-500",
          severity: "severity-moderate",
          severityLabel: getLabel("Moderate Stress | Evaporation High", "मध्यम जल तपन | तीव्र वाष्पीकरण", "మితమైన ఎండ వేడి | అధిక ఆవిరి రేటు"),
          title: getLabel("High Temperature Soil Stress Warning", "अत्यधिक तापमान से मिट्टी में नमी संकोच", "అధిక వేడి ఉష్ణోగ్రతల వల్ల పసుపు/మొక్కజొన్న వడిలిపోవు ముప్పు"),
          desc: getLabel(
            "Land temperatures hitting 34-35°C are accelerating vapor evaporation. Turmeric and maize roots are feeling high salt pressure stress.",
            "तापमान ३५ डिग्री सेल्सियस तक जाने से हल्दी की गांठें सूख रही हैं जिससे उपज प्रभावित हो सकती है।",
            "పగటి ఉష్ణోగ్రత 35°C కి చేరడం వల్ల పసుపు కొమ్ములు మరియ మొక్కజొన్న వేర్లు ఊపిరి ఆడక వడిలిపోయే అవకాశం ఉంది."
          ),
          precautions: [
            getLabel("Practice laser precision watering early in the mornings.", "सिर्फ सुबह के ठंडे समय में ही पेड़ों की जड़ों में पानी दें।", "కేవలం ఉదయాన్నే చల్లటి వేళల్లో మాత్రమే పంటలకు తేలికపాటి తడులు ఇవ్వండి."),
            getLabel("Integrate shredded organic maize residues over bare soils.", "नमी बनाये रखने के लिए मक्के की कटी घास क्यारियों पर डालें।", "నేలలో తేమ పదిలపరుచుటకు మొక్కజొన్న కొయ్యల వ్యర్థాలతో గట్టి మల్చింగ్ ఏర్పాటు చేయండి."),
            getLabel("Keep a strict check on sucking insect pests (Whitefly).", "सफेद मक्खी और कीटों के प्रसार पर विशेष ध्यान रखें।", "ఈ సమయంలో ఆకుమచ్చ తెగుళ్లు మరియు తెల్లదోమ వ్యాప్తిని గమనిస్తూ ఉండండి.")
          ]
        };

      case "Anantapur":
        return {
          type: "heat",
          badgeText: getLabel("☀️ Extreme Heat & Arid Stress", "☀️ भीषण गर्मी व जल संकट", "☀️ తీవ్రమైన ఎండ & నీటి ఎద్దడి హెచ్చరిక"),
          badgeStyle: "bg-amber-100/75 hover:bg-amber-150 border-amber-400 text-amber-900 shadow-amber-300/15",
          pulseColor: "bg-amber-600",
          severity: "severity-high",
          severityLabel: getLabel("Moisture Deficit | High Evaporation", "जल की भारी कमी | तीव्र वाष्पीकरण", "నీటి కొరత | అధిక నీటి ఆవిరి రేటు"),
          title: getLabel("Severe Desert Heat Alert & Soil Desiccation", "तीव्र मरुस्थलीय शुष्क हवाएं और तपन", "భూగర్భ జలాలు ఇంకిపోవడం & వేడి గాలుల హెచ్చరిక"),
          desc: getLabel(
            "Arid weather with high desert winds exceeding 24 km/h is draining ground moisture. Very high solar evapotranspiration rate. Groundnuts are prone to early wilting.",
            "२४ किमी/घंटा से अधिक की शुष्क गर्म हवाओं के कारण मिट्टी की नमी तेजी से उड़ रही है। मूंगफली के पौधों में पानी की कमी होने से झुलसन संभव है।",
            "గంటకు 24 కిలోమీటర్ల వేగంతో వీస్తున్న వేడి గాలుల కారణంగా భూమిలోని తేమ ఆవిరి అయిపోతుంది. దీనివల్ల వేరుశనగ మొక్కలు త్వరగా ఎండిపోతాయి."
          ),
          precautions: [
            getLabel("Operate localized drip lines early in the morning and at post-sunset.", "सिर्फ सुबह जल्दी या शाम के बाद ही ड्रिप सिंचाई का प्रयोग करें ताकि वाष्पीकरण न हो।", "నీటి ఆవిరిని అరికట్టడానికి ఉదయం పూట లేదా సూర్యాస్తమయం తర్వాత మాత్రమే డ్రిప్ ఆన్ చేయండి."),
            getLabel("Maintain thick organic sugarcane/straw cover on target crop bases.", "नमी बनाए रखने के लिए गन्ने के सूखे पत्तों या घास से पौधों को ढकें।", "నేలలో తేమ కాపాడటానికి ఆకుకూరలు లేదా ఎండు ఆకులతో సురక్షిత మల్చింగ్ చేయండి."),
            getLabel("Prioritize water allocation to fruit orchards and young podding crops.", "फलदार बगीचों और नई फलियों वाली फसलों को सिंचाई जल आवंटन में पहली प्राथमिकता दें।", "కొత్తగా పూత దశలో ఉన్న పంటలకు మరియు తోటలకు మొదటి ప్రాధాన్యతగా నీరు అందించండి.")
          ]
        };

      default:
        return null;
    }
  };

  const alert = getAlertDetail(selectedZone.district);

  if (!alert || isDismissedForZone === selectedZone.district) {
    return null;
  }

  return (
    <div className="relative" ref={overlayRef}>
      {/* ⚠️ Flashing Badge in Header */}
      <button
        id="header-weather-alert-badge"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1 border px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer animate-none hover:scale-[1.02] shadow-sm active:scale-97 ${alert.badgeStyle}`}
      >
        <span className="relative flex h-2 w-2 mr-1">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${alert.pulseColor}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${alert.pulseColor}`}></span>
        </span>
        <span className="truncate">{alert.badgeText}</span>
      </button>

      {/* 🗺️ Mock Weather Overlay Dropdown */}
      {isOpen && (
        <div
          id="weather-alert-dropdown-menu"
          className="absolute right-0 sm:right-auto sm:-left-32 md:-left-48 mt-3 w-[290px] sm:w-[350px] md:w-[420px] bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-fade-in text-left focus:outline-none"
        >
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1 px-1.5 bg-rose-500 text-white rounded text-[10px] font-bold uppercase tracking-wide">
                {alert.severityLabel}
              </span>
              <span className="text-[11px] text-slate-300 font-bold font-mono">
                {selectedZone.district} Context
              </span>
            </div>
            <button
              id="close-weather-alert-panel-btn"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alert Body */}
          <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Visual Header */}
            <div className="flex items-start space-x-3 bg-red-50/10 p-3 rounded-xl border border-slate-100">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0 mt-0.5">
                {alert.type === "rain" ? (
                  <CloudRain className="w-5 h-5" />
                ) : alert.type === "frost" ? (
                  <Snowflake className="w-5 h-5" />
                ) : (
                  <Thermometer className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight leading-snug">
                  {alert.title}
                </h4>
                <div className="flex items-center space-x-2 text-[10px] font-bold font-mono text-slate-400">
                  <span>Chance: {selectedZone.precipitationChance}</span>
                  <span>•</span>
                  <span>Temp: {selectedZone.currentSeasonTemp}</span>
                  <span>•</span>
                  <span>Humid: {selectedZone.humidity}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 italic">
              "{alert.desc}"
            </div>

            {/* Precaution Action checklist */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-sans">
                🛡️ {getLabel("Mandatory Agronomic Shield Measures", "अनिवार्य औषधीय सुरक्षा उपाय", "తప్పనిసరి వ్యవసాయ రక్షణ చర్యలు")}
              </h5>
              <div className="space-y-2 text-xs">
                {alert.precautions.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2.5 bg-white border border-slate-150 p-2.5 rounded-lg text-slate-700 hover:border-slate-300 transition-all font-medium"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 📲 FARMER SMS ALERTS AND WARNINGS INTERPRETER */}
            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/80 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 font-sans">
                  📲 {getLabel("FARMER SMS ALERT DISPATCHER", "किसान एसएमएस चेतावनी प्रेषक", "రైతు మొబైల్ SMS హెచ్చరికలు")}
                </h5>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wide">
                  Active
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {getLabel("Farmer Mobile Number:", "किसान का मोबाइल नंबर:", "రైతు మొబైల్ నంబర్:")}
                </label>
                <div className="flex gap-1.5">
                  <span className="bg-slate-100 border border-slate-200 rounded-lg px-2 text-xs font-bold text-slate-705 flex items-center justify-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    id="weather-sms-phone-input"
                    placeholder={getLabel("Enter 10-digit number", "१० अंकों का नंबर दर्ज करें", "10 అంకెల మొబైల్ నెంబర్")}
                    value={smsPhone}
                    onChange={(e) => onSmsPhoneChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-sans font-semibold tracking-wide text-slate-800"
                  />
                  <button
                    onClick={onTriggerTestSms}
                    type="button"
                    disabled={!smsPhone || smsPhone.trim().length < 10}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition-all hover:scale-[1.02] active:scale-97 disabled:opacity-50 disabled:hover:scale-100 disabled:pointer-events-none cursor-pointer flex items-center gap-1 shrink-0"
                    title="Send simulated warning message to verify connections"
                  >
                    <span>Test 📲</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-emerald-100/70">
                <label className="flex items-center space-x-2 bg-white/75 p-1.5 px-2 rounded-lg border border-slate-150 text-[10.5px] font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smsRainEnabled}
                    onChange={(e) => onSmsRainToggle(e.target.checked)}
                    className="text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                  />
                  <span>🌧️ {getLabel("Heavy Rain", "भारी वर्षा", "భారీ వర్షాలు")}</span>
                </label>

                <label className="flex items-center space-x-2 bg-white/75 p-1.5 px-2 rounded-lg border border-slate-150 text-[10.5px] font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={smsHeatEnabled}
                    onChange={(e) => onSmsHeatToggle(e.target.checked)}
                    className="text-emerald-600 focus:ring-emerald-500 rounded cursor-pointer"
                  />
                  <span>🔥 {getLabel("Heavy Heat", "तीव्र लू", "ఎండ తీవ్రత")}</span>
                </label>
              </div>
            </div>

            {/* Helpful Indicator Guide */}
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-[10px] text-amber-800 leading-relaxed font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {getLabel(
                  "These weather threat parameters are derived in real-time from our localized meteorology simulations. Please safeguard your fields immediately.",
                  "ये मौसम संबंधी चेतावनी नियम हमारे स्थानीय उपग्रह सिमुलेशन से वास्तविक समय में लिए गए हैं। कृपया अपनी फसल सुरक्षा का तत्काल इंतजाम करें।",
                  "ఈ వాతావరణ హెచ్చరికలు ఉపగ్రహ ముందస్తు పరిశీలనల ఆధారంగా పంపబడినవి. దయచేసి పంటను రక్షించుకోవడానికి వెంటనే తగిన పద్ధతులు పాటించండి."
                )}
              </span>
            </div>
          </div>

          {/* Footer controls */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] px-4">
            <span className="text-slate-400 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Active System Guard
            </span>
            <button
              id="dismiss-weather-warning-btn"
              onClick={() => {
                setIsDismissedForZone(selectedZone.district);
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-600 font-bold tracking-tight py-1 transition-all uppercase text-[10px] cursor-pointer"
            >
              {getLabel("Hide Warning", "चेतावनी छुपाएं", "హెచ్చరిక దాచు")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
