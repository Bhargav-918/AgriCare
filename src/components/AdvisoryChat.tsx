import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, AgriculturalZone } from "../types";
import { Send, Bot, User, Leaf, Sparkles, AlertCircle, RefreshCw, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AdvisoryChatProps {
  selectedZone: AgriculturalZone;
  preferredLanguage: string;
}

const QUICK_PROMPTS = [
  {
    english: "How can I improve nitrogen in clay soil naturally?",
    hindi: "चिकनी मिट्टी में प्राकृतिक रूप से नाइट्रोजन कैसे सुधारें?",
    telugu: "నల్ల రేగడి నేలలో సహజంగా నత్రజని పెంచడం ఎలా?"
  },
  {
    english: "Best organic pesticide for tomato whitefly attack?",
    hindi: "टमाटर में सफेद मक्खी के हमले के लिए सबसे अच्छा जैविक कीटनाशक?",
    telugu: "టమోటాకు తెల్ల దోమల దాడి నివారణకు ఉత్తమ సేంద్రీయ మందు?"
  },
  {
    english: "How often should I water Paddy during hot weather?",
    hindi: "गर्म मौसम में धान की फसल को कितनी बार पानी देना चाहिए?",
    telugu: "వేడి వాతావरणంలో వరి పంటకు ఎన్ని రోజులకు ఒకసారి నీరు పెట్టాలి?"
  }
];

export default function AdvisoryChat({ selectedZone, preferredLanguage }: AdvisoryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-welcome",
      role: "assistant",
      content: `### 🙏 Namaste! 
I am **KisaanSeva AI**, your personal Soil & Crop Protection Advisor.

I am grounded with the local ecosystem data for **${selectedZone.district}, ${selectedZone.state}**.
How can I assist you in your field today? You can ask about:
*   Crop Pest & Disease advice (Organic & Chemical)
*   Water management and soil cards
*   Organic compost recipes (Jeevamrut/Vermicompost)`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and update speech language
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    // Set recognition language matching UI preference
    if (preferredLanguage === "Hindi") {
      rec.lang = "hi-IN";
    } else if (preferredLanguage === "Telugu") {
      rec.lang = "te-IN";
    } else {
      rec.lang = "en-IN";
    }

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setUserInput((prev) => (prev ? prev + " " + transcript : transcript));
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setSpeechError(
          preferredLanguage === "Hindi"
            ? "माइक एक्सेस अनुमति नहीं है। कृपया ब्राउज़र अनुमति दें।"
            : preferredLanguage === "Telugu"
            ? "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. దయచేసి అనుమతించండి."
            : "Microphone permission denied. Please allow microphone access in your browser."
        );
      } else if (event.error === "no-speech") {
        setSpeechError(
          preferredLanguage === "Hindi"
            ? "कोई आवाज़ नहीं सुनी गई। कृपया दोबारा प्रयास करें।"
            : preferredLanguage === "Telugu"
            ? "వాయిస్ వినపడలేదు. మళ్ళీ ప్రయత్నించండి."
            : "No speech detected. Please try speaking again."
        );
      } else {
        setSpeechError(
          preferredLanguage === "Hindi"
            ? `माइक त्रुटि: ${event.error}`
            : preferredLanguage === "Telugu"
            ? `మైక్ లోపం: ${event.error}`
            : `Microphone issue: ${event.error}`
        );
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [preferredLanguage]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        preferredLanguage === "Hindi"
          ? "इस ब्राउज़र में भाषण पहचान समर्थित नहीं है। कृपया Google Chrome या Edge का उपयोग करें।"
          : preferredLanguage === "Telugu"
          ? "ఈ బ్రౌజర్‌లో వాయిస్ రికగ్నిషన్ సపోర్ట్ చేయదు. దయచేసి గూగుల్ క్రోమ్/ఎడ్జ్ ఉపయోగించండి."
          : "Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        setSpeechError(null);
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          preferredLanguage,
          locationInfo: selectedZone
        })
      });

      if (!response.ok) {
        throw new Error("Agri-server returned an invalid response.");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ **Advisory Connection Alert:** We encountered an issue fetching AI advice. Below are offline general points for your query: \n\n1. Check for correct soil moisture. \n2. Apply organic neem spray (50ml/1L solution).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "system-welcome-reset",
        role: "assistant",
        content: `### 🙏 Welcome to KisanSeva Advisory!
I have adapted to soil settings for **${selectedZone.district}, ${selectedZone.state}**. 
Ask me any field question, or use the quick buttons below:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Get dialect text
  const getPromptText = (prompt: typeof QUICK_PROMPTS[0]) => {
    if (preferredLanguage === "Hindi") return prompt.hindi;
    if (preferredLanguage === "Telugu") return prompt.telugu;
    return prompt.english;
  };

  return (
    <div 
      id="advisory-chat-widget"
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-[520px]"
    >
      {/* Header */}
      <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-emerald-100" />
          <div>
            <h3 className="font-sans font-semibold text-sm leading-tight">AI KisanSeva Advisor</h3>
            <p className="text-[10px] text-emerald-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping"></span>
              {preferredLanguage} Dialect Enabled
            </p>
          </div>
        </div>
        <button
          id="clear-chat-history-btn"
          onClick={clearChat}
          title="Reset conversation"
          className="text-white/80 hover:text-white hover:bg-white/10 rounded p-1.5 transition-all text-xs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2 max-w-[85%]">
              {msg.role === "assistant" && (
                <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg mt-1 shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              
              <div
                className={`rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="markdown-body prose max-w-none text-xs leading-relaxed space-y-1">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="leading-relaxed">{msg.content}</p>
                )}
                
                <span className={`block text-[9px] mt-1 text-right ${
                  msg.role === "user" ? "text-emerald-200" : "text-slate-400"
                }`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="p-1 bg-slate-200 text-slate-700 rounded-lg mt-1 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start gap-2">
              <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg mt-1 animate-spin">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-2.5 text-xs text-slate-400 italic shadow-sm">
                Thinking of agricultural solution...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggest Prompts */}
      <div className="p-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            id={`quick-prompt-${i}-btn`}
            onClick={() => handleSendMessage(getPromptText(prompt))}
            className="text-[10px] text-slate-600 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-full px-3 py-1 whitespace-nowrap transition-all font-medium shrink-0"
          >
            {getPromptText(prompt)}
          </button>
        ))}
      </div>

      {/* Web Speech State Indicator */}
      {(isListening || speechError) && (
        <div 
          id="speech-recognition-status-overlay" 
          className={`px-3 py-2 text-xs flex items-center justify-between border-t transition-all ${
            speechError 
              ? "bg-rose-50 border-rose-100 text-rose-700 font-medium" 
              : "bg-emerald-50 border-emerald-100 text-emerald-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${speechError ? 'bg-rose-500' : 'bg-emerald-500 animate-ping shrink-0'}`} />
            <span className="leading-tight">
              {speechError
                ? speechError
                : preferredLanguage === "Hindi"
                ? "🎙️ सुन रहा हूँ... जो आप बोलना चाहते हैं वो बोलें।"
                : preferredLanguage === "Telugu"
                ? "🎙️ వింటున్నాను... దయచేసి మాట్లాడండి."
                : "🎙️ Listening... Please speak now into your microphone."}
            </span>
          </div>
          {speechError && (
            <button
              id="clear-speech-error-btn"
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-rose-500 hover:text-rose-700 text-[10px] font-bold uppercase tracking-wider pl-2 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Form Input */}
      <form
        id="advisory-chat-send-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(userInput);
        }}
        className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2"
      >
        <input
          id="chat-user-message-input"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={
            preferredLanguage === "Hindi"
              ? "कृषि समस्या का निवारण पूछें..."
              : preferredLanguage === "Telugu"
              ? "వ్యవసాయ సమస్యని అడగండి..."
              : "Ask for agricultural remedies..."
          }
          className="flex-1 text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 outline-none focus:border-emerald-500 focus:bg-white text-slate-700 transition-all font-sans"
        />

        {/* 🎙️ Microphone voice recording button */}
        <button
          id="chat-toggle-microphone-btn"
          type="button"
          onClick={toggleListening}
          className={`p-2.5 rounded-lg transition-all shadow-sm shrink-0 flex items-center justify-center cursor-pointer ${
            isListening
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          title={isListening ? "Stop voice listening" : "Talk with your voice"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          id="chat-send-message-btn"
          type="submit"
          disabled={!userInput.trim() || isLoading}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
