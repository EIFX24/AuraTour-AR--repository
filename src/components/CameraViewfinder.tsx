import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Upload,
  Crosshair,
  Sparkles,
  MapPin,
  Compass,
  Zap,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { SAMPLE_LANDMARKS } from '../data/sampleLandmarks.ts';
import { SampleLandmark } from '../types/index.ts';

interface CameraViewfinderProps {
  onCaptureImage: (imageBase64: string, hint?: string) => void;
  isAnalyzing: boolean;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCaptureImage,
  isAnalyzing,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [shutterFlash, setShutterFlash] = useState<boolean>(false);
  const [userHint, setUserHint] = useState<string>('');

  // Simulated / live sensors
  const [heading, setHeading] = useState<number>(312);
  const [pitch, setPitch] = useState<number>(14);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number }>({
    lat: 48.8584,
    lng: 2.2945,
  });
  const [distanceMeters, setDistanceMeters] = useState<number>(185);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setStreamActive(true);
          setHasCameraPermission(true);
        };
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err?.message || err);
      setHasCameraPermission(false);
      setStreamActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();

    // Browser geolocation if permitted
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoCoords({
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
          });
        },
        () => {
          // Default to iconic Paris coordinates
          setGeoCoords({ lat: 48.8584, lng: 2.2945 });
        }
      );
    }

    // Dynamic telemetry drift for realistic AR feel
    const interval = setInterval(() => {
      setHeading((prev) => (prev + (Math.random() * 2 - 1) + 360) % 360);
      setPitch((prev) => Math.max(-30, Math.min(60, prev + (Math.random() * 0.8 - 0.4))));
      setDistanceMeters((prev) => Math.round(180 + Math.sin(Date.now() / 3000) * 15));
    }, 400);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Flip camera
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from video element
  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    onCaptureImage(dataUrl, userHint);
  };

  // Upload local file from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onCaptureImage(dataUrl, userHint);
      }
    };
    reader.readAsDataURL(file);
  };

  // Select a preset sample landmark
  const handleSelectSample = async (sample: SampleLandmark) => {
    try {
      // Fetch sample image and convert to data URL so the backend receives direct base64
      const response = await fetch(sample.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onCaptureImage(base64data, sample.hint);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      // Fallback pass image URL
      onCaptureImage(sample.imageUrl, sample.hint);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Viewfinder Frame */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] max-h-[620px] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 shadow-2xl shadow-cyan-950/40">
        {/* Shutter flash animation overlay */}
        <div
          className={`absolute inset-0 bg-white z-40 pointer-events-none transition-opacity duration-200 ${
            shutterFlash ? 'opacity-90' : 'opacity-0'
          }`}
        />

        {/* Live Video Stream or Fallback View */}
        {streamActive ? (
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-slate-900 to-slate-950">
            {/* Background city visual preview */}
            <img
              src="https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80"
              alt="Urban Viewfinder"
              className="absolute inset-0 w-full h-full object-cover opacity-25 filter blur-xs"
            />
            <div className="relative z-10 max-w-md p-6 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md">
              <Camera className="w-10 h-10 text-cyan-400 mx-auto mb-3 animate-pulse" />
              <h3 className="font-tech text-lg font-bold text-slate-100 tracking-wide mb-1">
                AR SCANNER STANDBY
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Connect your device camera to scan city monuments live, or upload an urban photo or pick a famous landmark below to experience the AI time-traveler narration.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110 transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  Enable Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  Upload Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AR HUD OVERLAYS */}
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
          {/* Top Telemetry Bar */}
          <div className="flex items-center justify-between text-[11px] font-telemetry text-cyan-400 bg-slate-950/70 border border-cyan-500/30 px-3 py-1.5 rounded-lg backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>HUD LOCK</span>
              </span>
              <span className="text-slate-500">|</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                {Math.round(heading)}° NW
              </span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-300">
                ELEV: +{Math.round(pitch)}°
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {geoCoords.lat.toFixed(3)}°N, {geoCoords.lng.toFixed(3)}°E
              </span>
              <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                RANGE: {distanceMeters}m
              </span>
            </div>
          </div>

          {/* Center Holographic Reticle */}
          <div className="relative flex-1 flex items-center justify-center">
            {/* Corner AR Framing Brackets */}
            <div className="absolute w-48 h-48 sm:w-64 sm:h-64 border-2 border-cyan-500/40 rounded-3xl pointer-events-none">
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-cyan-400"></div>
            </div>

            {/* Pulsing Target Ring */}
            <div className="relative flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" />
              <Crosshair className="absolute w-8 h-8 text-cyan-400/80 pointer-events-none" />
            </div>

            {/* Horizon Level Line */}
            <div className="absolute w-40 h-[1px] bg-cyan-500/30 pointer-events-none flex items-center justify-between">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            </div>

            {/* Target Status Tag */}
            <div className="absolute bottom-6 px-3 py-1 rounded-full bg-slate-950/80 border border-cyan-500/40 text-[11px] font-telemetry text-cyan-300 backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>POINT CAMERA AT MONUMENT / SKYLINE</span>
            </div>
          </div>

          {/* Bottom HUD Bar & Capture Controls */}
          <div className="flex items-center justify-between pointer-events-auto">
            {/* Flip Camera Button */}
            <button
              onClick={toggleCameraFacing}
              disabled={!streamActive}
              className="p-3 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition backdrop-blur-md disabled:opacity-40"
              title="Switch Camera (Front/Rear)"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Central Shutter Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={handleSnap}
                disabled={isAnalyzing}
                className="relative group p-1 rounded-full focus:outline-none disabled:opacity-50"
              >
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 opacity-70 group-hover:opacity-100 blur transition" />
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-950 border-4 border-cyan-400 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-transform">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 shadow-lg shadow-cyan-500/50 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-slate-950" />
                  </div>
                </div>
              </button>
              <span className="text-[10px] font-telemetry tracking-wider text-slate-300 mt-1 uppercase">
                {streamActive ? 'Snap Landmark' : 'Analyze Current'}
              </span>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition backdrop-blur-md"
              title="Upload photo from disk"
            >
              <Upload className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Optional Context/Hint Bar */}
      <div className="w-full max-w-xl flex items-center gap-2 px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl backdrop-blur-sm">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        <input
          type="text"
          value={userHint}
          onChange={(e) => setUserHint(e.target.value)}
          placeholder="Optional hint: e.g. 'Near Rome forum', 'Cathedral facade', 'Tokyo tower'..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 w-full focus:outline-none"
        />
        {userHint && (
          <button
            onClick={() => setUserHint('')}
            className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800"
          >
            Clear
          </button>
        )}
      </div>

      {/* Quick World Landmark Presets Tray */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h4 className="font-tech text-sm font-bold text-slate-200 tracking-wide uppercase">
              1-Tap Landmark Expedition Test
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Instant recognition & search grounding
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_LANDMARKS.slice(0, 4).map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => handleSelectSample(landmark)}
              disabled={isAnalyzing}
              className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 transition-all text-left bg-slate-900/60 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={landmark.imageUrl}
                  alt={landmark.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
              </div>
              <div className="p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-telemetry text-cyan-400 font-semibold tracking-wider">
                    {landmark.city}, {landmark.country}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>
                <h5 className="font-medium text-xs text-slate-100 group-hover:text-cyan-300 transition truncate">
                  {landmark.name}
                </h5>
              </div>
            </button>
          ))}
        </div>

        {/* More landmarks toggle / row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {SAMPLE_LANDMARKS.slice(4, 8).map((landmark) => (
            <button
              key={landmark.id}
              onClick={() => handleSelectSample(landmark)}
              disabled={isAnalyzing}
              className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/60 transition-all text-left bg-slate-900/60 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={landmark.imageUrl}
                  alt={landmark.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
              </div>
              <div className="p-2.5">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-telemetry text-cyan-400 font-semibold tracking-wider">
                    {landmark.city}, {landmark.country}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition" />
                </div>
                <h5 className="font-medium text-xs text-slate-100 group-hover:text-cyan-300 transition truncate">
                  {landmark.name}
                </h5>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
