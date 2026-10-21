import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CameraViewfinder } from './components/CameraViewfinder.tsx';
import { ARNarratedClip } from './components/ARNarratedClip.tsx';
import { HistoryDossier } from './components/HistoryDossier.tsx';
import { PassportJournal } from './components/PassportJournal.tsx';
import { LandmarkAnalysisResult, PassportEntry } from './types/index.ts';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Camera,
  Compass,
  CheckCircle2,
  Layers,
  Radio,
  Search,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'camera' | 'clip' | 'history' | 'passport'>('camera');
  const [currentLandmark, setCurrentLandmark] = useState<LandmarkAnalysisResult | null>(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>('Visual Landmark Recognition');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stored passport entries
  const [passportEntries, setPassportEntries] = useState<PassportEntry[]>(() => {
    try {
      const stored = localStorage.getItem('auratour_passport');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync passport to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('auratour_passport', JSON.stringify(passportEntries));
    } catch (err) {
      console.warn('Failed to save passport to localStorage:', err);
    }
  }, [passportEntries]);

  // Handle Photo Analysis
  const handleCaptureImage = async (imageBase64: string, hint?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setCurrentPhotoUrl(imageBase64);
    setAnalysisPhase('AI Computer Vision: Recognizing landmark...');

    // Progress phase simulator for rich user feedback
    const timer1 = setTimeout(() => {
      setAnalysisPhase('Google Search Grounding: Fetching verified historical secrets & timeline...');
    }, 2800);

    const timer2 = setTimeout(() => {
      setAnalysisPhase('Gemini TTS Audio: Synthesizing AR documentary narration...');
    }, 6500);

    try {
      const res = await fetch('/api/analyze-landmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          userHint: hint,
          selectedVoice: 'Kore',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server responded with ${res.status}`);
      }

      const data: LandmarkAnalysisResult = await res.json();
      setCurrentLandmark(data);
      setActiveTab('clip');

      // Auto-save initial stamp to passport
      const newEntry: PassportEntry = {
        id: `stamp_${Date.now()}`,
        timestamp: Date.now(),
        landmark: data,
        photoUrl: imageBase64,
        city: data.city || 'City',
        country: data.country || 'World',
      };

      setPassportEntries((prev) => {
        // Prevent duplicate immediate stamps
        const exists = prev.some((p) => p.landmark.name === data.name);
        return exists ? prev : [newEntry, ...prev];
      });
    } catch (err: any) {
      console.error('Landmark identification error:', err);
      setErrorMessage(
        err?.message || 'Could not analyze landmark image. Please try another photo or check your connection.'
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsAnalyzing(false);
    }
  };

  const handleSaveToPassport = () => {
    if (!currentLandmark || !currentPhotoUrl) return;
    const exists = passportEntries.some((p) => p.landmark.name === currentLandmark.name);
    if (exists) return;

    const newEntry: PassportEntry = {
      id: `stamp_${Date.now()}`,
      timestamp: Date.now(),
      landmark: currentLandmark,
      photoUrl: currentPhotoUrl,
      city: currentLandmark.city,
      country: currentLandmark.country,
    };
    setPassportEntries((prev) => [newEntry, ...prev]);
  };

  const isCurrentSaved =
    currentLandmark !== null &&
    passportEntries.some((p) => p.landmark.name === currentLandmark.name);

  // Restore past passport entry
  const handleSelectPassportEntry = (entry: PassportEntry) => {
    setCurrentLandmark(entry.landmark);
    setCurrentPhotoUrl(entry.photoUrl);
    setActiveTab('clip');
  };

  const handleDeletePassportEntry = (id: string) => {
    setPassportEntries((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearAllPassport = () => {
    if (window.confirm('Clear all recorded stamps from your travel passport?')) {
      setPassportEntries([]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Telemetry Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveLandmark={currentLandmark !== null}
        passportCount={passportEntries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="max-w-5xl mx-auto px-4 pt-4">
            <div className="p-4 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-center justify-between text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="px-2 py-1 rounded bg-red-900/60 hover:bg-red-800 text-slate-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Camera & AR Viewfinder */}
        {activeTab === 'camera' && (
          <CameraViewfinder
            onCaptureImage={handleCaptureImage}
            isAnalyzing={isAnalyzing}
          />
        )}

        {/* Tab 2: AR-Style Narrated Clip View */}
        {activeTab === 'clip' && currentLandmark && currentPhotoUrl && (
          <ARNarratedClip
            landmark={currentLandmark}
            photoUrl={currentPhotoUrl}
            onSaveToPassport={handleSaveToPassport}
            isSavedInPassport={isCurrentSaved}
            onViewHistoryDossier={() => setActiveTab('history')}
          />
        )}

        {/* Tab 3: Search Grounded Historical Dossier */}
        {activeTab === 'history' && currentLandmark && (
          <HistoryDossier landmark={currentLandmark} />
        )}

        {/* Tab 4: Passport Journal */}
        {activeTab === 'passport' && (
          <PassportJournal
            entries={passportEntries}
            onSelectEntry={handleSelectPassportEntry}
            onDeleteEntry={handleDeletePassportEntry}
            onClearAll={handleClearAllPassport}
            onStartNewScan={() => setActiveTab('camera')}
          />
        )}
      </main>

      {/* FULLSCREEN AR TELEMETRY PROCESSING MODAL */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/50 shadow-2xl shadow-cyan-950/80 text-center space-y-5">
            {/* Holographic Radar Ring Animation */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-cyan-500/50 animate-spin" />
              <div className="relative w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>

            {/* Status Information */}
            <div className="space-y-2">
              <span className="text-[11px] font-telemetry tracking-widest uppercase text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800">
                AR TELEMETRY LOCK IN PROGRESS
              </span>
              <h3 className="font-tech text-lg font-bold text-slate-100">
                Analyzing Urban Landmark
              </h3>
              <p className="text-xs text-slate-300 font-sans max-w-xs mx-auto leading-relaxed">
                {analysisPhase}
              </p>
            </div>

            {/* Telemetry checklist */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-telemetry space-y-1.5 text-left">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  Image Understanding (gemini-4-argon)
                </span>
                <span className="text-cyan-400 font-semibold">Active</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-emerald-400" />
                  Search Grounding (gemini-3.8-flash)
                </span>
                <span className="text-emerald-400 font-semibold">Ready</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-amber-400" />
                  Docu-Voice TTS (gemini-3.8-flash-tts)
                </span>
                <span className="text-amber-400 font-semibold">Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
