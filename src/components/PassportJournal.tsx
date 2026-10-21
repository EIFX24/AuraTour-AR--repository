import React from 'react';
import {
  BookOpen,
  MapPin,
  Clock,
  Play,
  Trash2,
  Sparkles,
  Award,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { PassportEntry } from '../types/index.ts';

interface PassportJournalProps {
  entries: PassportEntry[];
  onSelectEntry: (entry: PassportEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onStartNewScan: () => void;
}

export const PassportJournal: React.FC<PassportJournalProps> = ({
  entries,
  onSelectEntry,
  onDeleteEntry,
  onClearAll,
  onStartNewScan,
}) => {
  const uniqueCities = Array.from(new Set(entries.map((e) => e.city)));

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Passport Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/40 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tech text-xl font-bold text-slate-100 tracking-wider">
                  URBAN EXPLORER PASSPORT
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-telemetry bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold">
                  LEVEL {Math.min(10, Math.max(1, entries.length))}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Archived field expeditions, AI recognized landmarks, and audio narrations
              </p>
            </div>
          </div>

          {/* Explorer Stats */}
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-amber-900/50 text-center">
              <span className="block text-lg font-tech font-bold text-amber-400 leading-none">
                {entries.length}
              </span>
              <span className="text-[10px] font-telemetry text-slate-400 uppercase">
                Stamps
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-cyan-900/50 text-center">
              <span className="block text-lg font-tech font-bold text-cyan-400 leading-none">
                {uniqueCities.length}
              </span>
              <span className="text-[10px] font-telemetry text-slate-400 uppercase">
                Cities
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Entries List or Empty State */}
      {entries.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-amber-400/80">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-tech text-lg font-bold text-slate-200">
              NO EXPEDITIONS STAMPED YET
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Use your camera or pick a famous landmark to scan the city. AI will recognize it, fetch verified history via Google Search, and record your digital passport stamp.
            </p>
          </div>
          <button
            onClick={onStartNewScan}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-tech font-bold text-xs tracking-wider shadow-lg shadow-cyan-500/20 hover:brightness-110 transition"
          >
            START FIRST EXPEDITION
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-telemetry text-slate-400 uppercase tracking-wider">
              Collected Visa Stamps ({entries.length})
            </span>
            <button
              onClick={onClearAll}
              className="text-[11px] font-telemetry text-red-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Stamps
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="group relative rounded-2xl overflow-hidden border border-amber-900/40 bg-slate-900/80 hover:border-amber-500/60 transition-all shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={entry.photoUrl}
                    alt={entry.landmark.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Stamp Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/60 text-amber-300 font-telemetry text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-md">
                    ★ PASSPORT VERIFIED
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteEntry(entry.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/80 text-slate-400 hover:text-red-400 transition"
                    title="Remove stamp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Information Body */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-[11px] font-telemetry text-cyan-400">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {entry.city}, {entry.country}
                    </div>
                    <h5 className="font-tech text-base font-bold text-slate-100 group-hover:text-amber-300 transition mt-0.5">
                      {entry.landmark.name}
                    </h5>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {entry.landmark.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-telemetry text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>

                    <button
                      onClick={() => onSelectEntry(entry)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-tech font-bold tracking-wider flex items-center gap-1 transition"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>REPLAY AR</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
