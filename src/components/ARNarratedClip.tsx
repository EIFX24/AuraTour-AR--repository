import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  Eye,
  Bookmark,
  Share2,
  Compass,
  Maximize2,
  Minimize2,
  User,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  Clock,
  MapPin,
  Check,
} from 'lucide-react';
import { LandmarkAnalysisResult, LandmarkHotspot, NarrationSegment } from '../types/index.ts';

interface ARNarratedClipProps {
  landmark: LandmarkAnalysisResult;
  photoUrl: string;
  onSaveToPassport: () => void;
  isSavedInPassport: boolean;
  onViewHistoryDossier: () => void;
}

export const ARNarratedClip: React.FC<ARNarratedClipProps> = ({
  landmark,
  photoUrl,
  onSaveToPassport,
  isSavedInPassport,
  onViewHistoryDossier,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(24);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    landmark.narration.voiceName || 'Kore'
  );
  const [isRegeneratingVoice, setIsRegeneratingVoice] = useState<boolean>(false);

  // AR visual view modes
  const [viewMode, setViewMode] = useState<'holo' | 'blueprint' | 'dusk'>('holo');
  const [kenBurnsActive, setKenBurnsActive] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<LandmarkHotspot | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Initialize Audio from base64
  useEffect(() => {
    if (landmark.narration.audioBase64) {
      const mime = landmark.narration.audioMimeType || 'audio/wav';
      const url = `data:${mime};base64,${landmark.narration.audioBase64}`;
      setCurrentAudioUrl(url);
    } else {
      // Fallback: estimate duration based on narration text length
      const wordCount = landmark.narration.script.split(/\s+/).length;
      setDuration(Math.max(12, Math.round(wordCount / 2.5)));
    }
  }, [landmark]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentAudioUrl]);

  // Toggle playback
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.warn('Audio play prevented:', e));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Change voice persona and synthesize new TTS via /api/synthesize-speech
  const handleVoiceChange = async (newVoice: string) => {
    setSelectedVoice(newVoice);
    setIsRegeneratingVoice(true);
    try {
      const res = await fetch('/api/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: landmark.narration.script,
          voice: newVoice,
        }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const mime = data.mimeType || 'audio/wav';
        const newUrl = `data:${mime};base64,${data.audioBase64}`;
        setCurrentAudioUrl(newUrl);
        if (audioRef.current) {
          audioRef.current.src = newUrl;
          audioRef.current.play().then(() => setIsPlaying(true));
        }
      }
    } catch (err) {
      console.error('Failed to regenerate voice:', err);
    } finally {
      setIsRegeneratingVoice(false);
    }
  };

  // Calculate active narration segment based on currentTime
  const activeSegment: NarrationSegment | undefined =
    landmark.narration.segments.find(
      (seg) => currentTime >= seg.startTime && currentTime <= seg.endTime
    ) ||
    (currentTime >= (landmark.narration.segments[0]?.startTime || 0)
      ? landmark.narration.segments[landmark.narration.segments.length - 1]
      : landmark.narration.segments[0]);

  // Determine active hotspot matching active segment
  const activeHotspotId = activeSegment?.hotspotId;
  const activeHotspot =
    landmark.hotspots.find((h) => h.id === activeHotspotId) ||
    selectedHotspot ||
    landmark.hotspots[0];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Hidden audio element */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          preload="auto"
          muted={isMuted}
        />
      )}

      {/* Header Landmark Identity Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[11px] font-telemetry uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
              {landmark.architecturalStyle || 'Landmark Architecture'}
            </span>
            <span className="text-xs text-slate-400 font-telemetry">
              Built {landmark.builtYear || 'Historical Period'}
            </span>
            {landmark.architect && (
              <span className="text-xs text-slate-400 font-telemetry hidden sm:inline">
                • {landmark.architect}
              </span>
            )}
          </div>
          <h2 className="font-tech text-2xl sm:text-3xl font-bold text-slate-100 tracking-wide flex items-baseline gap-2">
            {landmark.name}
            {landmark.nativeName && (
              <span className="text-base text-slate-400 font-sans font-normal">
                ({landmark.nativeName})
              </span>
            )}
          </h2>
          <p className="text-xs text-cyan-300/80 font-telemetry flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {landmark.city}, {landmark.country}
            {landmark.coordinates && (
              <span className="text-slate-500">
                ({landmark.coordinates.lat.toFixed(3)}°N, {landmark.coordinates.lng.toFixed(3)}°E)
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSaveToPassport}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSavedInPassport
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isSavedInPassport ? (
              <>
                <Check className="w-4 h-4 text-amber-400" />
                <span>Stamped in Passport</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Stamp Passport</span>
              </>
            )}
          </button>

          <button
            onClick={onViewHistoryDossier}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-tech tracking-wide transition shadow-lg shadow-cyan-600/20 flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Search Dossier</span>
          </button>
        </div>
      </div>

      {/* AR CINEMATIC VIEWPORT CONTAINER */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[640px] rounded-3xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-2xl shadow-cyan-950/60 group">
        {/* Landmark Image with dynamic view filters and Ken Burns camera animation */}
        <div
          className={`w-full h-full relative transition-all duration-700 ${
            kenBurnsActive && isPlaying ? 'animate-kenburns' : ''
          }`}
        >
          <img
            src={photoUrl}
            alt={landmark.name}
            className={`w-full h-full object-cover transition-all duration-700 ${
              viewMode === 'blueprint'
                ? 'filter invert hue-rotate-180 contrast-150 saturate-50 brightness-90'
                : viewMode === 'dusk'
                ? 'filter brightness-90 contrast-125 saturate-125 sepia-25'
                : ''
            }`}
          />
        </div>

        {/* View Mode Specific Shader Overlays */}
        {viewMode === 'holo' && (
          <div className="absolute inset-0 pointer-events-none ar-grid-overlay opacity-40 mix-blend-screen" />
        )}

        {viewMode === 'blueprint' && (
          <div className="absolute inset-0 pointer-events-none bg-blue-950/30 mix-blend-color-dodge border-2 border-cyan-400/30">
            <div className="absolute top-4 right-4 text-[10px] font-telemetry text-cyan-300 bg-blue-900/80 px-2 py-1 rounded border border-cyan-500/40">
              ARCHITECTURAL BLUEPRINT RECONSTRUCTION
            </div>
          </div>
        )}

        {/* Scanning beam line */}
        {isPlaying && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="w-full h-16 ar-scanline" />
          </div>
        )}

        {/* SPATIAL HOLOGRAPHIC HOTSPOTS PROJECTED ON THE LANDMARK */}
        <div className="absolute inset-0 pointer-events-none">
          {landmark.hotspots.map((hotspot) => {
            const isHotspotActive =
              activeHotspot?.id === hotspot.id || selectedHotspot?.id === hotspot.id;

            return (
              <div
                key={hotspot.id}
                style={{
                  left: `${hotspot.xPercent}%`,
                  top: `${hotspot.yPercent}%`,
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-all duration-500 z-30"
              >
                {/* Glowing Concentric Sonar Rings */}
                <div className="relative flex items-center justify-center">
                  <div
                    className={`absolute rounded-full transition-all duration-500 ${
                      isHotspotActive
                        ? 'w-12 h-12 bg-cyan-400/30 border border-cyan-300 animate-ping'
                        : 'w-7 h-7 bg-cyan-500/15 border border-cyan-500/30'
                    }`}
                  />

                  {/* Center Dot Button */}
                  <button
                    onClick={() =>
                      setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot)
                    }
                    className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all transform hover:scale-125 focus:outline-none shadow-lg ${
                      isHotspotActive
                        ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/80 scale-110 ring-4 ring-cyan-400/40'
                        : 'bg-slate-900/90 text-cyan-300 border border-cyan-400/70 hover:bg-cyan-500 hover:text-slate-950'
                    }`}
                    title={hotspot.title}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                  </button>

                  {/* Hotspot Floating Tag */}
                  <div
                    className={`absolute left-7 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg backdrop-blur-md transition-all duration-300 pointer-events-auto ${
                      isHotspotActive
                        ? 'bg-slate-950/90 border border-cyan-400 text-cyan-300 shadow-xl shadow-cyan-500/30 opacity-100 scale-100'
                        : 'bg-slate-950/60 border border-slate-700/60 text-slate-300 text-opacity-80 opacity-0 group-hover:opacity-90 scale-95'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                      <span className="text-xs font-tech font-bold tracking-wide">
                        {hotspot.title}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Hotspot Detailed Floating Card */}
        {selectedHotspot && (
          <div className="absolute bottom-28 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-xs z-30 p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-500/50 backdrop-blur-lg shadow-2xl text-slate-200 animate-fade-in">
            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-cyan-900/40">
              <span className="text-[10px] font-telemetry text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                AR ARCHITECTURAL HOTSPOT
              </span>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-xs text-slate-400 hover:text-slate-100 px-1"
              >
                ✕
              </button>
            </div>
            <h4 className="font-tech text-sm font-bold text-slate-100 mb-1">
              {selectedHotspot.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedHotspot.description}
            </p>
          </div>
        )}

        {/* TOP VIEWPORT HUD TELEMETRY */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] font-telemetry text-cyan-300">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              AR STREAM 24KHz
            </span>
            <span className="text-slate-600">|</span>
            <span className="hidden sm:inline">
              HOTSPOTS: {landmark.hotspots.length} DETECTED
            </span>
          </div>

          {/* AR Filter Toggle Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-cyan-500/30 p-1 rounded-xl backdrop-blur-md pointer-events-auto">
            <button
              onClick={() => setViewMode('holo')}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry transition ${
                viewMode === 'holo'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              HOLO
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry transition ${
                viewMode === 'blueprint'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BLUEPRINT
            </button>
            <button
              onClick={() => setViewMode('dusk')}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry transition ${
                viewMode === 'dusk'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              DUSK
            </button>
            <button
              onClick={() => setKenBurnsActive(!kenBurnsActive)}
              className={`p-1 rounded-lg text-[10px] font-telemetry transition ${
                kenBurnsActive ? 'text-cyan-400' : 'text-slate-500'
              }`}
              title="Toggle Cinematic Pan/Zoom"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BOTTOM SYNCHRONIZED SUBTITLES BANNER */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className="max-w-2xl mx-auto p-3 sm:p-4 rounded-2xl bg-slate-950/85 border border-cyan-500/40 backdrop-blur-md shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-1 text-[10px] font-telemetry text-cyan-400 uppercase tracking-widest">
              <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
              <span>AR NARRATION FEED</span>
              {activeHotspot && (
                <>
                  <span>•</span>
                  <span className="text-amber-400">FOCUS: {activeHotspot.title}</span>
                </>
              )}
            </div>
            <p className="font-sans text-xs sm:text-sm text-slate-100 font-medium leading-relaxed transition-all">
              {activeSegment ? (
                <span>{activeSegment.text}</span>
              ) : (
                <span className="text-slate-400 italic">
                  Press play to begin narrated AR landmark clip...
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* AUDIO NARRATION TRANSPORT CONTROLS & VOICE SELECTOR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md space-y-4">
        {/* Progress Bar & Timing */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-telemetry text-slate-400">
            <span className="text-cyan-400 font-bold">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {/* Dynamic Equalizer Wave Bars */}
              <div className="flex items-end gap-0.5 h-3">
                {[40, 90, 60, 100, 75, 45, 80, 50, 95, 30].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      height: isPlaying ? `${Math.max(20, (h * (Math.sin(currentTime * 4 + i) + 1.2)) / 2)}%` : '20%',
                    }}
                    className={`w-0.5 rounded-full transition-all duration-150 ${
                      isPlaying ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-1 uppercase text-slate-300">
                {isPlaying ? 'Narrating' : 'Paused'}
              </span>
            </div>
            <span>{formatTime(duration)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 25}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Transport (Play, Restart, Speed) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
              title="Restart Narration"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 hover:brightness-110 text-slate-950 font-bold text-xs font-tech tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE CLIP</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>PLAY AR CLIP</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Speed Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changeSpeed(rate)}
                  className={`px-2 py-0.5 text-[10px] font-telemetry rounded-lg transition ${
                    playbackRate === rate
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>

          {/* AI Voice Persona Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-telemetry hidden sm:inline flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              TTS Voice:
            </span>

            <select
              value={selectedVoice}
              disabled={isRegeneratingVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="bg-slate-950 text-xs font-telemetry text-cyan-300 border border-cyan-800/60 rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="Kore">Kore (Cultural Historian)</option>
              <option value="Fenrir">Fenrir (Deep Documentary)</option>
              <option value="Puck">Puck (Energetic Guide)</option>
              <option value="Aoede">Aoede (Art & Architectural Critic)</option>
              <option value="Zephyr">Zephyr (Bilingual Adventurer)</option>
            </select>

            {isRegeneratingVoice && (
              <span className="text-[10px] text-cyan-400 animate-pulse font-telemetry">
                Synthesizing...
              </span>
            )}
          </div>
        </div>

        {/* Narration Transcript Drawer */}
        <div className="pt-2 border-t border-slate-800/80">
          <details className="group">
            <summary className="cursor-pointer text-xs font-telemetry text-slate-400 hover:text-cyan-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Full Narration Script Transcript
              </span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90 text-slate-500" />
            </summary>
            <div className="mt-2.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
              <p>{landmark.narration.script}</p>
            </div>
          </details>
        </div>
      </div>

      {/* QUICK STATS CALLOUT STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {landmark.fastFacts.map((fact, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5"
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0 mt-0.5">
              <span className="font-telemetry text-xs text-cyan-400 font-bold">
                0{idx + 1}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{fact}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
