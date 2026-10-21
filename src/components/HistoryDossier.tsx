import React, { useState } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  ExternalLink,
  Clock,
  Key,
  HelpCircle,
  Send,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { LandmarkAnalysisResult, GroundingSource } from '../types/index.ts';

interface HistoryDossierProps {
  landmark: LandmarkAnalysisResult;
}

export const HistoryDossier: React.FC<HistoryDossierProps> = ({ landmark }) => {
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [qaHistory, setQaHistory] = useState<
    { question: string; answer: string; sources?: GroundingSource[] }[]
  >([]);

  const handleAskQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuestion.trim() || isAsking) return;

    const q = userQuestion.trim();
    setUserQuestion('');
    setIsAsking(true);

    try {
      const res = await fetch('/api/ask-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarkName: landmark.name,
          city: landmark.city,
          question: q,
        }),
      });
      const data = await res.json();
      setQaHistory((prev) => [
        {
          question: q,
          answer: data.answer || 'Information gathered via Google Search.',
          sources: data.sources || [],
        },
        ...prev,
      ]);
    } catch (err: any) {
      setQaHistory((prev) => [
        {
          question: q,
          answer: `Could not reach tour guide service: ${err?.message || 'Network error'}`,
        },
        ...prev,
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestions = [
    `What are the most famous hidden secrets of ${landmark.name}?`,
    `Can tourists go inside or climb to the top today?`,
    `How did it survive wars or natural disasters?`,
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Search Grounding Authenticity Badge */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-500/30 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tech text-base font-bold text-slate-100 tracking-wide">
                  GOOGLE SEARCH GROUNDED DOSSIER
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-telemetry bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-bold">
                  LIVE VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time search verification for {landmark.name} ({landmark.city}, {landmark.country})
              </p>
            </div>
          </div>

          {/* Search queries executed */}
          {landmark.searchQueries && landmark.searchQueries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:max-w-md">
              {landmark.searchQueries.map((query, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] font-telemetry rounded-lg bg-slate-950/80 text-cyan-300 border border-cyan-800/60 flex items-center gap-1"
                >
                  <Search className="w-2.5 h-2.5 text-cyan-400" />
                  {query}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout: Historical Highlights & Secrets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historical Evolution Timeline */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h4 className="font-tech text-sm font-bold text-slate-100 tracking-wide uppercase">
              Chronological Milestones
            </h4>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-cyan-900/60 pl-6">
            {landmark.historicalHighlights.map((milestone, idx) => (
              <div key={idx} className="relative group">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-4 ring-slate-950" />
                <span className="text-[11px] font-telemetry font-bold text-cyan-300 block mb-0.5">
                  {milestone.era}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden Secrets & Mysteries */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Key className="w-4 h-4 text-amber-400" />
            <h4 className="font-tech text-sm font-bold text-slate-100 tracking-wide uppercase">
              Hidden Secrets & Urban Lore
            </h4>
          </div>

          <div className="space-y-3">
            {landmark.hiddenSecrets.map((secret, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-900/40 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <h5 className="font-tech text-xs font-bold text-amber-300">
                    {secret.title}
                  </h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {secret.story}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ask the AR Tour Guide (Search Grounded Interactive Q&A) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <h4 className="font-tech text-sm font-bold text-slate-100 tracking-wide uppercase">
              Ask AI Travel Guide
            </h4>
          </div>
          <span className="text-[11px] font-telemetry text-slate-400">
            Grounded via Google Search (gemini-3.8-flash)
          </span>
        </div>

        {/* Input form */}
        <form onSubmit={handleAskQuestion} className="flex gap-2">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            placeholder={`Ask anything about ${landmark.name}... (e.g. ticket advice, construction secrets)`}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={isAsking || !userQuestion.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-tech tracking-wider flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isAsking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>ASK</span>
              </>
            )}
          </button>
        </form>

        {/* Quick query recommendation chips */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setUserQuestion(sq);
              }}
              className="px-2.5 py-1 text-[11px] font-telemetry rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-700/60 transition text-left"
            >
              + {sq}
            </button>
          ))}
        </div>

        {/* QA Stream History */}
        {qaHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            {qaHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/50 space-y-2 animate-fade-in"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 font-tech">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Q: {item.question}</span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line pl-5 border-l-2 border-cyan-500/40">
                  {item.answer}
                </div>
                {item.sources && item.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1 pl-5">
                    {item.sources.map((s, si) => (
                      <a
                        key={si}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-telemetry text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verified Web Grounding References */}
      {landmark.groundedSources && landmark.groundedSources.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <h4 className="font-tech text-sm font-bold text-slate-100 tracking-wide uppercase">
              Web Grounding Citations & Sources
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {landmark.groundedSources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition group flex flex-col justify-between"
              >
                <span className="text-xs text-slate-200 font-medium group-hover:text-emerald-300 transition line-clamp-2">
                  {source.title}
                </span>
                <span className="text-[10px] font-telemetry text-slate-500 group-hover:text-slate-400 flex items-center gap-1 mt-2">
                  <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                  View Original Reference
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
