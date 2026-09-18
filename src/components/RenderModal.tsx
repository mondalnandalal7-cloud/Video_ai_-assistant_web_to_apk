import React from 'react';
import { Film, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';

interface RenderModalProps {
  isOpen: boolean;
  progress: number;
  stageMessage: string;
  error?: string | null;
  onCancel?: () => void;
}

export const RenderModal: React.FC<RenderModalProps> = ({
  isOpen,
  progress,
  stageMessage,
  error,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Visual milestones
  const stages = [
    { threshold: 10, label: 'Preparing', desc: 'Timeline & Audio Graph' },
    { threshold: 30, label: 'Generating scenes', desc: 'Keyframe Textures' },
    { threshold: 50, label: 'Generating voice', desc: 'Narration & Phonemes' },
    { threshold: 80, label: 'Rendering', desc: 'Compositing Captions & Video' },
    { threshold: 100, label: 'Finalizing', desc: 'MP4 Packaging' },
  ];

  return (
    <div
      id="render-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
    >
      <div
        id="render-modal-card"
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#0C101A] p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated Render Icon */}
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400">
            {error ? (
              <AlertCircle className="h-10 w-10 text-rose-400" />
            ) : progress >= 100 ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            ) : (
              <>
                <Film className="h-9 w-9 text-indigo-400 animate-pulse" />
                <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white shadow-md">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                </div>
              </>
            )}
          </div>

          <h3 className="text-xl font-bold text-white">
            {error
              ? 'Rendering Interrupted'
              : progress >= 100
              ? 'Video Rendered Successfully!'
              : 'Rendering Faceless Video'}
          </h3>

          <p className="mt-1.5 text-xs text-slate-400 min-h-[32px] max-w-[90%]">
            {error || stageMessage || 'Processing neural timeline...'}
          </p>

          {/* Large Progress Percentage */}
          <div className="my-4 text-3xl font-black tracking-tight text-indigo-400">
            {progress}%
          </div>

          {/* Progress Bar */}
          <div className="w-full rounded-full bg-slate-800/80 p-1">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                error
                  ? 'bg-rose-500'
                  : progress >= 100
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, progress))}%` }}
            />
          </div>

          {/* Milestone Checklist */}
          <div className="mt-6 w-full space-y-2 text-left">
            {stages.map((st) => {
              const isDone = progress >= st.threshold;
              const isCurrent =
                progress >= st.threshold - 20 && progress < st.threshold;

              return (
                <div
                  key={st.label}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold'
                      : isDone
                      ? 'text-slate-300'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-slate-700" />
                    )}
                    <span>{st.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{st.threshold}%</span>
                </div>
              );
            })}
          </div>

          {/* Cancel button if needed */}
          {onCancel && progress < 100 && !error && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-6 text-xs text-slate-400 hover:text-white"
            >
              Cancel Render
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
