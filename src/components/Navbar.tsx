import React from 'react';
import { Camera, Compass, BookOpen, Volume2, Sparkles, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: 'camera' | 'clip' | 'history' | 'passport';
  setActiveTab: (tab: 'camera' | 'clip' | 'history' | 'passport') => void;
  hasActiveLandmark: boolean;
  passportCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveLandmark,
  passportCount,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-cyan-900/40 bg-slate-950/90 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Telemetry Indicator */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20">
            <Compass className="w-5 h-5 text-slate-950 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-ping" />
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-tech text-lg font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
                AURA<span className="text-cyan-400">TOUR</span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-telemetry tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 rounded">
                  AR 3.8
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-telemetry text-slate-400">
              <span className="flex items-center text-emerald-400 gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                AI VISION
              </span>
              <span>•</span>
              <span className="text-cyan-400">SEARCH GROUNDED</span>
              <span>•</span>
              <span className="text-amber-400">TTS NARRATION</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'camera'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Camera AR</span>
          </button>

          {hasActiveLandmark && (
            <>
              <button
                onClick={() => setActiveTab('clip')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'clip'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>AR Clip</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'history'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Search Dossier</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('passport')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'passport'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Passport</span>
            {passportCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-telemetry rounded-full bg-amber-500/30 text-amber-300 font-bold">
                {passportCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
