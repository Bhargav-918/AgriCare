import React from "react";
import { Info, HelpCircle, Server, FileCode, CheckCircle, Database } from "lucide-react";

interface DiagExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagExplanationDialog({ isOpen, onClose }: DiagExplanationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        id="diag-explanation-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col motion-preset-fade"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6" />
            <div>
              <h2 className="font-sans font-semibold text-lg leading-tight">AI & Model Workflow Technical Spec</h2>
              <p className="text-emerald-100 text-xs">How KisaanSeva AI operates in the real-world field</p>
            </div>
          </div>
          <button 
            id="close-explanation-modal-btn"
            onClick={onClose}
            className="text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1.5 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 font-sans">
          {/* Section 1: Model & Core Technology */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-600" />
              1. LLM / Computer Vision Core Model
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              This advisory platform utilizes **Google Gemini 3.5-Flash** as the active vision and reasoning backbone. 
              The server-side proxy acts as a secure gateway, protecting API keys and enforcing rate limits. It converts 
              uplinked raw leaf image streams directly into low-latency token sequences.
            </p>
            <div className="pl-7 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs text-slate-600 space-y-1">
              <div>• Developer Engine: @google/genai TypeScript SDK v2.4+</div>
              <div>• Inference Target: gemini-3.5-flash (with Multimodal Vision)</div>
              <div>• Fallback Engine: Agronomy Pre-calculated Rule Simulation Matrix</div>
            </div>
          </div>

          {/* Section 2: Datasets & Context Knowledge base */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              2. Domain Dataset & Context Grounding
            </h3>
            <p className="text-slate-600 leading-relaxed pl-7">
              The AI model leverages pre-trained weights covering millions of broad-leaf, cereal crop, and horticultural pest 
              images (representing diverse pathologies like rusts, blights, stem borer tunnels, mildew spores, and aphids). On top 
              of generic weights, our **Context-Aware Payload** appends:
            </p>
            <ul className="list-disc list-inside pl-10 text-slate-600 space-y-1">
              <li>**Regional Crop Matrices:** Matches prevailing cultivars based on state/district soils.</li>
              <li>**Meteorological Context:** Adjusts fungal spread forecasts based on ambient humidity and rain.</li>
              <li>**Language Adaptation:** Localizes translation for vernacular dialects in Hindi, Telugu, and English.</li>
            </ul>
          </div>

          {/* Section 3: The Safe Pipeline Flow */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-600" />
              3. Processing Pipeline Flowchart
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center pl-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Step 1</span>
                <span className="text-xs font-semibold text-slate-800">Uplink Photo</span>
                <p className="text-[10px] text-slate-500 mt-1">Mobile Camera or Sample Preset</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-dashed border-emerald-200">
                <span className="block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Step 2</span>
                <span className="text-xs font-semibold text-emerald-800 font-mono">Express Proxy</span>
                <p className="text-[10px] text-slate-500 mt-1">Appends moisture & soil vectors</p>
              </div>
              <div className="bg-teal-50 p-3 rounded-xl border border-dashed border-teal-200">
                <span className="block text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">Step 3</span>
                <span className="text-xs font-semibold text-teal-800 font-mono">Gemini Vision</span>
                <p className="text-[10px] text-slate-500 mt-1">Extracts symptoms & lesion contours</p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl border border-dashed border-indigo-200">
                <span className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Step 4</span>
                <span className="text-xs font-semibold text-indigo-800">Response</span>
                <p className="text-[10px] text-slate-500 mt-1">Organic + chemical split-advice</p>
              </div>
            </div>
          </div>

          {/* Section 4: Accuracy & Limitations warning */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
            <h4 className="font-semibold text-amber-900 flex items-center text-xs gap-1.5">
              <Info className="w-4 h-4 text-amber-700" />
              FIELD LEVEL PRECISION DISCLAIMER & LIMITATIONS
            </h4>
            <p className="text-[12px] text-amber-800 leading-relaxed">
              While Gemini 3.5-Flash represents the cutting-edge of automated plant pathology, image resolution, lighting variables, and 
              underlying root conditions (which are invisible to leaf cameras) can alter inferences. Users must strictly utilize 
              the <strong>Organic Remediation</strong> recommendations as safe first-line steps and seek live crop extension officer verification 
              for broad systemic sprays or suspicious pest threats.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
          <button 
            id="close-explanation-spec-btn"
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors text-xs font-medium rounded-lg"
          >
            I Understand the Workflow
          </button>
        </div>
      </div>
    </div>
  );
}
