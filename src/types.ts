export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface DiagnosisResult {
  report: string;
  source: string;
  isMock?: boolean;
  timestamp: string;
  language?: string;
}

export interface AgriculturalZone {
  state: string;
  district: string;
  regionName: string;
  soilType: string;
  primaryCrops: string[];
  climate: string;
  currentSeasonTemp: string;
  humidity: string;
  precipitationChance: string;
}

export interface CropSample {
  id: string;
  name: string;
  localName: string;
  crop: string;
  symptoms: string;
  imageUrl: string;
  notes: string;
  // Included directly as predefined dummy base64 structure so users can test immediately
  sampleBase64: string;
}
