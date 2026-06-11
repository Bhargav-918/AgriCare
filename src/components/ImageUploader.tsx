import React, { useState, useRef } from "react";
import { SAMPLE_CROPS } from "../samples";
import { CropSample } from "../types";
import { Upload, Camera, ImageIcon, Trash2, HelpCircle, FileText, Check, Sparkles } from "lucide-react";

interface ImageUploaderProps {
  onImageSelected: (base64: string, cropName: string, notes: string) => void;
  preferredLanguage: string;
}

export default function ImageUploader({ onImageSelected, preferredLanguage }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cropName, setCropName] = useState("");
  const [notes, setNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG/JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onImageSelected(base64, cropName, notes);
    };
    reader.readAsDataURL(file);
    setActiveSampleId(null);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const selectSample = (sample: CropSample) => {
    setPreview(sample.sampleBase64);
    setCropName(sample.crop);
    setNotes(sample.notes);
    setActiveSampleId(sample.id);
    onImageSelected(sample.sampleBase64, sample.crop, sample.notes);
  };

  const resetUploader = () => {
    setPreview(null);
    setCropName("");
    setNotes("");
    setActiveSampleId(null);
    onImageSelected("", "", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isHindi = preferredLanguage === "Hindi";
  const isTelugu = preferredLanguage === "Telugu";

  const getLabel = (eng: string, hin: string, tel: string) => {
    if (isHindi) return hin;
    if (isTelugu) return tel;
    return eng;
  };

  return (
    <div id="image-uploader-section" className="space-y-6">
      {/* Visual upload box */}
      <div
        id="image-drag-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
          dragOver 
            ? "border-emerald-500 bg-emerald-50/50 scale-98" 
            : preview 
            ? "border-emerald-300 bg-emerald-50/10 hover:border-emerald-400" 
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100/50"
        }`}
      >
        <input
          id="camera-file-input"
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="image/*"
          className="hidden"
        />

        {preview ? (
          <div className="w-full h-full space-y-3 flex flex-col items-center">
            {/* Visual preview layout */}
            <div className="relative w-40 h-40 rounded-xl overflow-hidden shadow-md border-4 border-white bg-slate-100">
              <img 
                src={preview} 
                alt="Uploaded leaf preview" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                id="reset-uploaded-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  resetUploader();
                }}
                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow"
                title="Remove image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="text-xs text-slate-500 font-medium">
              ✨ {getLabel("Photo loaded successfully. Change with another click", "फोटो सफलतापूर्वक लोड हुआ। बदलने के लिए क्लिक करें", "ఫోటో లోడ్ చేయబడింది. మార్చడానికి క్లిక్ చేయండి")}
            </div>
          </div>
        ) : (
          <div id="drop-text" className="space-y-3 py-4">
            <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <p className="font-sans font-semibold text-slate-800 text-sm">
                {getLabel("Uplink / Take Leaf Photo", "पत्ती की फोटो अपलोड करें / खींचें", "ఆకు ఫోటోను ఇక్కడ అప్‌లోడ్ చేయండి")}
              </p>
              <p className="text-slate-500 text-xs">
                {getLabel("Drag and drop photo here, or click to capture", "फोटो यहां खींचें, या कैमकॉर्डर से लें", "ఫైల్ లాగి వదలండి లేదా క్లిక్ చేయండి")}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button 
                id="trigger-file-capture-btn"
                type="button" 
                className="bg-white border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-700 shadow-sm flex items-center gap-1.5 hover:bg-slate-50 active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                {getLabel("Device Camera", "कैमरा चलाएं", "కెమెరాతో తీయండి")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommended sample templates for review (Video demo friendly) */}
      <div id="sample-picker-section" className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2.5">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-emerald-600 animate-pulse" />
            {getLabel("No live crop handy? Use Demo Crop Samples", "लाइव फसल नहीं है? परीक्षण हेतु नमूना चुनें", "పంట ఆకు లేదా తెగులు నమూనాలు")}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Demo Files
          </span>
        </label>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SAMPLE_CROPS.map((sample) => {
            const isActive = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                id={`sample-crop-btn-${sample.id}`}
                type="button"
                onClick={() => selectSample(sample)}
                className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between h-[85px] relative ${
                  isActive 
                    ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/40"
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-xl shrink-0">{sample.imageUrl}</span>
                  {isActive && <Check className="w-4 h-4 text-emerald-600 shrink-0 bg-white rounded-full p-0.5 border border-emerald-500" />}
                </div>
                <div className="space-y-0.5 mt-2">
                  <div className="font-bold text-slate-800 line-clamp-1">{sample.crop}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{sample.name}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs for crop attributes & notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Crop Name input */}
        <div className="space-y-1.5">
          <label id="crop-name-label" className="text-xs font-semibold text-slate-700 block">
            {getLabel("Crop / Cultivar Name (Optional)", "फसल / किस्म का नाम (वैल्पिक)", "పంట రకం పేరు")}
          </label>
          <input
            id="crop-name-text-input"
            type="text"
            value={cropName}
            onChange={(e) => {
              setCropName(e.target.value);
              onImageSelected(preview || "", e.target.value, notes);
            }}
            placeholder="e.g. Tomato Arka Vikas, Paddy (IR64), Cotton"
            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:border-emerald-500 transition-all font-medium"
          />
        </div>

        {/* Notes input */}
        <div className="space-y-1.5">
          <label id="farmer-notes-label" className="text-xs font-semibold text-slate-700 block">
            {getLabel("Symptoms or Farmer Observations", "लक्षण या किसान का विवरण", "ఇతర గమనికలు లేదా లక్షణాలు")}
          </label>
          <input
            id="notes-text-input"
            type="text"
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              onImageSelected(preview || "", cropName, e.target.value);
            }}
            placeholder="e.g. spots on lower leaves, minor leaf bending, wet soil"
            className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50 focus:bg-white text-slate-700 outline-none focus:border-emerald-500 transition-all font-medium"
          />
        </div>
      </div>
      
      {/* Safe camera captures instructions */}
      <div className="p-3 bg-blue-50/55 rounded-xl border border-blue-100/50 flex gap-2 text-[11px] text-blue-800 leading-relaxed">
        <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <strong>Photo Tip:</strong> Keep the leaf centered, flat, and well-lit. Zoom in close to visible rust spots or insects so the visual model can dissect outlines clearly.
        </div>
      </div>
    </div>
  );
}
