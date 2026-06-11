import React, { useState, useEffect, useRef } from "react";
import { AgriculturalZone, DiagnosisResult } from "../types";
import { Upload, Trash2, HelpCircle, Sparkles, CheckCircle, Clock, Thermometer, ShieldCheck, FileText, ChevronRight, RefreshCw, Layers } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { User } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, setDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

interface SoilHealthAdvisoryProps {
  selectedZone: AgriculturalZone;
  preferredLanguage: string;
  currentUser: User | null;
  primaryCrops?: string[];
}

const SOIL_LOADER_IPS = [
  "Extracting soil health card imagery and parameters...",
  "Calibrating pH-dependent micronutrient solubility thresholds...",
  "Cross-analyzing regional climate zone with intended crop water load...",
  "Determining calcium/gypsum dosage formulas for alkaline sodic levels...",
  "Synthesizing NPK ratio requirements for maximum yield...",
  "Formulating organic humic remedies and multi-season crop rotation..."
];

export default function SoilHealthAdvisory({ selectedZone, preferredLanguage, currentUser, primaryCrops = [] }: SoilHealthAdvisoryProps) {
  // Configured inputs
  const [soilType, setSoilType] = useState(selectedZone.soilType);
  const [pH, setPh] = useState(6.5);
  const [nitrogen, setNitrogen] = useState("Medium");
  const [phosphorus, setPhosphorus] = useState("Medium");
  const [potassium, setPotassium] = useState("Medium");
  const [organicMatter, setOrganicMatter] = useState("Medium");
  const [targetCrop, setTargetCrop] = useState("");
  const [pastSoilTests, setPastSoilTests] = useState<any[]>([]);
  
  // File upload state for soil test report
  const [reportImageBase64, setReportImageBase64] = useState<string>("");
  const [reportFileName, setReportFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [activeReportPreview, setActiveReportPreview] = useState<string | null>(null);

  // Advisory output states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [advisoryReport, setAdvisoryReport] = useState<DiagnosisResult | null>(null);
  const [loaderIndex, setLoaderIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize defaults if the selected zone changes
  useEffect(() => {
    if (selectedZone) {
      setSoilType(selectedZone.soilType);
    }
    // Pick first primary crop as initial target suggestion if targetCrop is empty
    if (primaryCrops && primaryCrops.length > 0) {
      if (!targetCrop) setTargetCrop(primaryCrops[0]);
    } else if (selectedZone?.primaryCrops && selectedZone.primaryCrops.length > 0) {
      if (!targetCrop) setTargetCrop(selectedZone.primaryCrops[0]);
    }
  }, [selectedZone, primaryCrops]);

  // Loading animation intervals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoaderIndex((prev) => (prev + 1) % SOIL_LOADER_IPS.length);
      }, 2200);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Synchronize past soil tests in real-time
  useEffect(() => {
    if (!currentUser) {
      setPastSoilTests([]);
      return;
    }

    const q = query(
      collection(db, "users", currentUser.uid, "soilTests"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tests: any[] = [];
        snapshot.forEach((doc) => {
          tests.push({ id: doc.id, ...doc.data() });
        });
        setPastSoilTests(tests);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${currentUser.uid}/soilTests`);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle uploaded reports
  const handleReportFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image of your Soil Test report (JPG/PNG).");
      return;
    }
    setReportFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setActiveReportPreview(base64);
      setReportImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const clearReportFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveReportPreview(null);
    setReportImageBase64("");
    setReportFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit to API
  const runSoilAnalysis = async () => {
    setIsAnalyzing(true);
    setAdvisoryReport(null);
    setLoaderIndex(0);

    try {
      const response = await fetch("/api/soil-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soilType,
          pH: pH.toString(),
          nitrogen,
          phosphorus,
          potassium,
          organicMatter,
          targetCrop,
          reportImageBase64,
          preferredLanguage,
          primaryCrops
        })
      });

      if (!response.ok) {
        throw new Error("Soil advisory generation failed on server.");
      }

      const data = await response.json();
      setAdvisoryReport({
        report: data.report,
        source: data.source,
        isMock: data.isMock,
        timestamp: data.timestamp
      });

      if (currentUser) {
        const docId = `soil_${Date.now()}`;
        try {
          const soilRef = doc(db, "users", currentUser.uid, "soilTests", docId);
          await setDoc(soilRef, {
            userId: currentUser.uid,
            soilType,
            pH,
            nitrogen,
            phosphorus,
            potassium,
            organicMatter,
            targetCrop: targetCrop || "General Crop",
            report: data.report,
            district: selectedZone.district,
            state: selectedZone.state,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${currentUser.uid}/soilTests/${docId}`);
        }
      }
    } catch (error: any) {
      console.error(error);
      const fallbackReport = `### 🌱 Soil Health Advisory Offline Fallback
        
An error occurred during remote analysis. Here is a baseline recommendation for **${soilType}** showing neutral pH characteristics:

1.  **Macro-Nutrients Strategy:** Integrate **NPK 19:19:19** balanced soluble feeds.
2.  **Bio-stimulants:** Apply **Jeevamrut** or vermicompost to stimulate biological aeration.
3.  **Rotation:** Do not sow solanaceous crops in repeating cycles.`;

      setAdvisoryReport({
        report: fallbackReport,
        source: "Offline Recovery Soil Database",
        isMock: true,
        timestamp: new Date().toISOString()
      });

      if (currentUser) {
        const docId = `soil_${Date.now()}`;
        try {
          const soilRef = doc(db, "users", currentUser.uid, "soilTests", docId);
          await setDoc(soilRef, {
            userId: currentUser.uid,
            soilType,
            pH,
            nitrogen,
            phosphorus,
            potassium,
            organicMatter,
            targetCrop: targetCrop || "General Crop",
            report: fallbackReport,
            district: selectedZone.district,
            state: selectedZone.state,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${currentUser.uid}/soilTests/${docId}`);
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick select helper preset buttons
  const QUICK_CROPS = ["Rice (Paddy)", "Wheat", "Maize", "Cotton", "Sugarcane", "Tomato", "Chili", "Soybean"];

  // Language translation helpers
  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  // Get qualitative feedback about PH in real-time
  const getPHAnalysis = (val: number) => {
    if (val < 5.5) {
      return {
        label: getLabel("Strongly Acidic (Iron rich, Low Phosphorus)", "अत्यधिक अम्लीय (लौह प्रचुर, कम फास्फोरस)", "తీవ్ర ఆమ్లత కలిగి ఉంది (సూక్ష్మ జింక్ కొరత)"),
        color: "text-red-600 bg-red-50 border-red-100",
        bar: "bg-red-500"
      };
    } else if (val >= 5.5 && val < 6.5) {
      return {
        label: getLabel("Moderately Acidic (Suitable for most grains)", "मध्यम अम्लीय (अनाज फसलों के लिए अनुकूल)", "మధ్యస్థ ఆమ్లత్వం (వడ్లు, పప్పులకు అనుకూలం)"),
        color: "text-amber-600 bg-amber-50 border-amber-100",
        bar: "bg-amber-500"
      };
    } else if (val >= 6.5 && val <= 7.5) {
      return {
        label: getLabel("Neutral - Optimal Balance (Ideal soil chemical state)", "उदासीन - सर्वोत्तम संतुलन (आदर्श मिट्टी अवस्था)", "సమతుల్య తటస్థం - అత్యుత్తమ నేల పిహెచ్"),
        color: "text-emerald-700 bg-emerald-50 border-emerald-100",
        bar: "bg-emerald-600"
      };
    } else {
      return {
        label: getLabel("Alkaline Sodic (High Sodium & Boron, needs Gypsum)", "क्षारीय मिट्टी (उच्च सोडियम, जिप्सम की आवश्यकता)", "క్షార నేల (సోడియం నిల్వలు ఎక్కువ, జిప్సం అవసరం)"),
        color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        bar: "bg-indigo-600"
      };
    }
  };

  const currentPH = getPHAnalysis(pH);

  return (
    <div id="soil-health-advisory-root" className="space-y-6">
      
      {/* Visual Soil Card Intro Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-teal-600 text-white rounded-lg flex items-center justify-center font-bold">
              🌱
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {getLabel("Soil Nutrient Advisory & Fertilizer Planner", "मृदा स्वास्थ्य निदान और उर्वरक योजक", "భూసార పరీక్ష మరియు ఎరువుల సిఫార్సులు")}
              </h3>
              <p className="text-xs text-slate-500">
                {getLabel("Calculate targeted amendments, liming additions, and NPK dosages", "उर्वरक की सही खुराक और मिट्टी सुधार योजना तय करें", "నేలకు తగిన జిప్సం, సున్నం మరియు పోషక నిష్పత్తులను కనుగొనండి")}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-full uppercase self-start md:self-auto">
            AGRI-CHEMISTRY ENGINE
          </span>
        </div>

        {/* Inputs Form and Photo row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          
          {/* Left Inputs block */}
          <div className="space-y-4">
            
            {/* Target Crop field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                {getLabel("1. Target Sowing Crop", "1. बुवाई की जाने वाली फसल", "1. పండించబోయే పంట పేరు")}
              </label>
              <input
                id="soil-target-crop-input"
                type="text"
                value={targetCrop}
                onChange={(e) => setTargetCrop(e.target.value)}
                placeholder="e.g. Paddy, Cotton, Sugarcane, Tomatoes"
                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:border-teal-500 transition-all font-medium"
              />
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1 mt-1.5 animate-fade-in">
                {QUICK_CROPS.map((crop) => (
                  <button
                    key={crop}
                    onClick={() => setTargetCrop(crop)}
                    className={`text-[10px] px-2 py-1 rounded-md border font-medium transition-all cursor-pointer ${
                      targetCrop.toLowerCase() === crop.toLowerCase()
                        ? "bg-teal-50 border-teal-500 text-teal-700 font-bold shadow-xs"
                        : "bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>

              {primaryCrops && primaryCrops.length > 0 && (
                <div className="pt-1 select-none animate-fade-in">
                  <span className="text-[9px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                    🌾 Quick Select My Crops:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {primaryCrops.map((crop) => (
                      <button
                        key={crop}
                        type="button"
                        onClick={() => setTargetCrop(crop)}
                        className={`text-[10px] px-2.5 py-0.5 rounded-full border font-extrabold transition-all cursor-pointer ${
                          targetCrop.toLowerCase() === crop.toLowerCase()
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-emerald-50/50 border-emerald-100 text-emerald-850 hover:bg-emerald-100/50"
                        }`}
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Soil Type and pH Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  {getLabel("2. Observed Soil Type", "2. मिट्टी का प्रकार", "2. నేల రకం")}
                </label>
                <select
                  id="soil-type-selector"
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:border-teal-500 transition-all font-medium"
                >
                  <option value="Alluvial Soil / Sandy Clay">Alluvial loam / Gangetic plains</option>
                  <option value="Black Cotton Soil / Regur">Regur Black Cotton Soil</option>
                  <option value="Red Sandy / Gravelly Soil">Red Sandy gravelly loam</option>
                  <option value="Clayey Loam / Non-porous">Sticky Clayey Loam</option>
                  <option value="Laterite / Iron Oxidic Soil">Laterite / Red Hills</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">
                    {getLabel("3. Soil pH Level:", "3. मिट्टी पीएच स्तर:", "3. ఆమ్ల గుణం పిహెచ్:")}
                  </label>
                  <span className="text-xs font-black text-teal-700 p-1 bg-teal-50 border border-teal-100 rounded-md">
                    {pH.toFixed(1)} pH
                  </span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-500">4.0</span>
                  <input
                    id="soil-ph-slider"
                    type="range"
                    min="4.0"
                    max="10.0"
                    step="0.1"
                    value={pH}
                    onChange={(e) => setPh(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer outline-none accent-teal-600 focus:ring-2 focus:ring-teal-500/20"
                  />
                  <span className="text-[10px] font-bold text-indigo-500">10.0</span>
                </div>
                {/* Real-time pH diagnosis analysis text */}
                <div id="ph-live-description-badge" className={`mt-1.5 text-[10px] border px-2 py-1 rounded-lg text-center font-bold ${currentPH.color} animate-fade-in`}>
                  {currentPH.label}
                </div>
              </div>

            </div>

            {/* Nutrients status grid */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-teal-600" />
                {getLabel("4. Macro-Nutrients Status (NPK)", "4. मुख्य पोषक तत्वों की उपलब्धता (एनपीके)", "4. భూమిలో లభ్యమయ్యే పోషకాలు (NPK)")}
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Nitrogen */}
                <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    {getLabel("Nitrogen (N)", "नाइट्रोजन (N)", "నత్రజని (నైట్రోజన్)")}
                  </label>
                  <div className="flex gap-1 justify-between">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setNitrogen(lvl)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-md border flex-1 text-center transition-all ${
                          nitrogen === lvl
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phosphorus */}
                <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    {getLabel("Phosphorus (P)", "फास्फोरस (P)", "భాస్వరం (ఫాస్ఫరస్)")}
                  </label>
                  <div className="flex gap-1 justify-between">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setPhosphorus(lvl)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-md border flex-1 text-center transition-all ${
                          phosphorus === lvl
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Potassium */}
                <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    {getLabel("Potassium (K)", "पोटैशियम (K)", "పొటాషియం (పొటాష్)")}
                  </label>
                  <div className="flex gap-1 justify-between">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setPotassium(lvl)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-md border flex-1 text-center transition-all ${
                          potassium === lvl
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Organic Matter */}
                <div className="space-y-1 bg-slate-50/70 p-2 rounded-xl border border-slate-200/50">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    {getLabel("Organic Matter / Carbon", "जैविक पदार्थ / कार्बन", "సేంద్రీయ కర్బనం")}
                  </label>
                  <div className="flex gap-1 justify-between">
                    {["Low", "Medium", "High"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setOrganicMatter(lvl)}
                        className={`text-[9px] font-bold px-2.5 py-1 rounded-md border flex-1 text-center transition-all ${
                          organicMatter === lvl
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Right Soil Report Scan Input */}
          <div className="flex flex-col justify-between space-y-4">
            
            <div className="space-y-1.5 flex-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>
                  {getLabel("5. Upload Soil Health Report Card (Optional)", "5. सरकारी मृदा परीक्षण पत्रक अपलोड करें (वैकल्पिक)", "5. భూసార నివేదిక కార్డు అప్‌లోడ్ చెయ్యండి")}
                </span>
                <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-mono font-bold">INTELLIGENT OCR</span>
              </label>

              {/* Drag Area */}
              <div
                id="soil-report-drag-zone"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); if(e.dataTransfer.files?.[0]) handleReportFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[175px] ${
                  dragOver 
                    ? "border-teal-500 bg-teal-50/40 scale-98"
                    : activeReportPreview 
                    ? "border-teal-300 bg-teal-50/10 hover:border-teal-400"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <input
                  id="soil-report-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => { if (e.target.files?.[0]) handleReportFile(e.target.files[0]); }}
                  className="hidden"
                />

                {activeReportPreview ? (
                  <div className="space-y-2 flex flex-col items-center">
                    <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                      <img 
                        src={activeReportPreview} 
                        alt="Soil report preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <button
                        id="clear-soil-report-file-btn"
                        onClick={clearReportFile}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow"
                        title="Delete file"
                      >
                        <Trash2 className="w-3" h-3 />
                      </button>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">
                      {reportFileName}
                    </div>
                    <div className="text-[10px] text-teal-600 font-medium">
                      {getLabel("✨ Report loaded. AI will extract parameters", "✨ रिपोर्ट लोड हो गई है। एआई विवरण पढ़ेगा", "✨ నివేదిక విజయవంతంగా పొందుపరచబడింది")}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 py-2">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-teal-600">
                      <Upload className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">
                        {getLabel("Drop Soil Card Scan or Photo", "मृदा परीक्षण रिपोर्ट फोटो यहां डालें", "భూసార కార్డు ఫోటోను ఇక్కడ వేయండి")}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {getLabel("Drag and drop photo here, or click to browse", "फोटो यहां खींचें, या देखने के लिए क्लिक करें", "ఫోటోను ఇక్కడ చేర్చండి లేదా క్లిక్ చేయండి")}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 shadow-sm">
                      <FileText className="w-3 h-3 text-slate-400" /> JPEG / PNG image
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Run Analysis button */}
            <div className="pt-2">
              <button
                id="run-soil-analysis-btn"
                onClick={runSoilAnalysis}
                disabled={isAnalyzing}
                className={`w-full py-3.5 rounded-xl font-bold font-sans tracking-wide transition-all shadow-md text-xs flex items-center justify-center gap-2 ${
                  isAnalyzing
                    ? "bg-teal-100 text-teal-700 cursor-wait border border-teal-200"
                    : "bg-teal-600 hover:bg-teal-700 text-white hover:scale-[1.01] shadow-teal-600/10 active:scale-99"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                {isAnalyzing
                  ? getLabel("AI Chemists parsing minerals...", "एआई विश्लेषण जारी है...", "AI భూసార విశ్లేషణ చేస్తోంది...")
                  : getLabel("Run AI Soil Health Analysis", "उर्वरक एवं मृदा स्वास्थ्य विश्लेषण शुरू करें", "AI భూసార ఆరోగ్య రిపోర్ట్ ప్రారంభించు")}
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Advisory Report Card rendering area */}
      <div id="soil-advisory-report-card" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1 px-2 bg-teal-100 text-teal-800 rounded-md text-xs font-bold">
              3.
            </div>
            <h4 className="font-bold text-slate-800 text-sm">
              {getLabel("AI Soil Fertility & Fertilization Remediation Report", "उर्वरक सलाह और मृदा अनुकूलन समाधान", "AI ఎరువులు మరియు మట్టి పిహెచ్ సలహా నివేదిక")}
            </h4>
          </div>
          {advisoryReport && (
            <span id="soil-report-model-source" className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
              {advisoryReport.source}
            </span>
          )}
        </div>

        <div className="p-5 md:p-6">
          {isAnalyzing ? (
            <div id="soil-report-loading" className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-teal-100 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 border-4 border-t-teal-600 rounded-full animate-spin"></div>
                <RefreshCw className="w-5 h-5 text-teal-600 animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h5 className="font-bold text-slate-800 text-sm">KisaanSeva Chemistry Analytics Core</h5>
                <p className="text-slate-500 text-xs italic transition-all animate-pulse px-2">
                  "{SOIL_LOADER_IPS[loaderIndex]}"
                </p>
              </div>
            </div>
          ) : advisoryReport ? (
            <div id="soil-analysis-report-container" className="space-y-6">
              
              {/* Detailed advisory content */}
              <div className="markdown-body prose max-w-none text-slate-800 text-xs leading-relaxed space-y-1">
                <ReactMarkdown>{advisoryReport.report}</ReactMarkdown>
              </div>

              {/* Footer details */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  Analysis Time: {new Date(advisoryReport.timestamp).toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Calibrated for Soil: {soilType}
                </div>
              </div>

            </div>
          ) : (
            <div id="soil-report-empty" className="py-12 text-center text-slate-500 space-y-3.5">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-teal-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <p className="font-bold text-slate-800 text-xs">
                  {getLabel("No Soil Health Card loaded", "कोई मृदा विश्लेषण लोड नहीं है", "ఎటువంటి భూసార నివేదికలు విశ్లేషించబడలేదు")}
                </p>
                <p className="text-slate-400 text-[11px] leading-normal">
                  {getLabel("Select soil type, pH levels, and target crops above. Click 'Run AI Soil Health Analysis' to map detailed mineral requirements.", "पीएच स्लाइडर, एनपीके स्तर का चयन करें और मृदा विश्लेषण रिपोर्ट प्राप्त करने के लिए बटन दबाएं।", "పైన ఇవ్వబడిన పారామీటర్స్ నమోదు చేసి AI బటన్ పై క్లిక్ చేయడం ద్వారా సమగ్ర నివేదిక పొందగలరు.")}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {currentUser && pastSoilTests.length > 0 && (
        <div id="soil-test-archive-strip" className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <span className="p-1 bg-teal-50 text-teal-600 rounded-md text-xs">📊</span>
            <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between w-full">
              <span>Your Soil Card Cloud Backups</span>
              <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full animate-pulse">Live Feed Sync</span>
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pastSoilTests.map((rec) => (
              <button
                key={rec.id}
                id={`history-soil-item-${rec.id}`}
                onClick={() => {
                  setSoilType(rec.soilType);
                  setPh(rec.pH);
                  setNitrogen(rec.nitrogen);
                  setPhosphorus(rec.phosphorus);
                  setPotassium(rec.potassium);
                  setOrganicMatter(rec.organicMatter);
                  setTargetCrop(rec.targetCrop);
                  setAdvisoryReport({
                    report: rec.report,
                    source: "Cloud Backup Restore",
                    isMock: false,
                    timestamp: rec.timestamp?.seconds ? new Date(rec.timestamp.seconds * 1000).toISOString() : new Date().toISOString()
                  });
                }}
                className="text-left p-3.5 rounded-xl border border-slate-150 hover:border-teal-300 hover:bg-teal-50/10 transition-all flex flex-col justify-between gap-1.5 focus:ring-1 focus:ring-teal-500/20 group cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2 w-full">
                  <h5 className="font-bold text-xs text-slate-800 group-hover:text-teal-700 truncate">{rec.targetCrop}</h5>
                  <span className="text-[10px] font-mono font-extrabold text-teal-750 p-0.5 bg-teal-50 px-1.5 rounded">{rec.pH} pH</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 w-full font-medium">
                  <span className="truncate max-w-[120px]">Soil: {rec.soilType.split("/")[0]}</span>
                  <span>{rec.timestamp?.seconds ? new Date(rec.timestamp.seconds * 1000).toLocaleDateString() : "Just now"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
