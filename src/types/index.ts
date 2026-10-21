export interface LandmarkHotspot {
  id: string;
  title: string;
  description: string;
  xPercent: number; // 0 - 100%
  yPercent: number; // 0 - 100%
  cameraFocus: 'wide' | 'crown' | 'base' | 'arch' | 'detail';
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface NarrationSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  hotspotId?: string;
}

export interface LandmarkAnalysisResult {
  name: string;
  nativeName?: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  architecturalStyle: string;
  builtYear: string;
  architect: string;
  summary: string;
  hotspots: LandmarkHotspot[];
  fastFacts: string[];
  historicalHighlights: {
    era: string;
    description: string;
  }[];
  hiddenSecrets: {
    title: string;
    story: string;
  }[];
  groundedSources: GroundingSource[];
  searchQueries: string[];
  narration: {
    script: string;
    segments: NarrationSegment[];
    audioBase64?: string;
    audioMimeType?: string;
    voiceName?: string;
  };
}

export interface PassportEntry {
  id: string;
  timestamp: number;
  landmark: LandmarkAnalysisResult;
  photoUrl: string;
  city: string;
  country: string;
}

export interface SampleLandmark {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  imageUrl: string;
  photographer: string;
  hint: string;
}
