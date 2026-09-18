import React from 'react';
import {
  BookmarkCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Music,
  Type,
  Maximize2,
  Film,
} from 'lucide-react';
import { Template } from '../types';

interface TemplatesViewProps {
  templates: Template[];
  onUseTemplate: (templateId: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  templates,
  onUseTemplate,
}) => {
  return (
    <div id="templates-view-container" className="space-y-6 pb-24">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            BLUEPRINTS
          </span>
          <span className="text-xs text-slate-400">High Retention Formats</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Video Templates</h1>
        <p className="text-xs text-slate-400 mt-1">
          Start instantly with viral algorithmic blueprints tuned for shorts, reels, and video essays.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            id={`tpl-card-${tpl.id}`}
            className="group flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/50 p-6 shadow-md transition-all hover:border-indigo-500/60 hover:bg-slate-900/80 hover:shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                  {tpl.scriptStyle}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {tpl.defaultDuration}
                </span>
              </div>

              <h3 className="mt-3 text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                {tpl.name}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{tpl.description}</p>

              {/* Badges / Specs */}
              <div className="mt-4 space-y-2 border-t border-slate-800/80 pt-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    Visual Style:
                  </span>
                  <span className="font-semibold text-slate-200">{tpl.visualStyle}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-amber-400" />
                    Captions:
                  </span>
                  <span className="font-semibold text-slate-200">{tpl.captionStyle}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-purple-400" />
                    Audio Mood:
                  </span>
                  <span className="font-semibold text-slate-200">{tpl.musicMood}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-slate-950 px-2 py-0.5 text-[10px] text-slate-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                id={`use-tpl-btn-${tpl.id}`}
                onClick={() => onUseTemplate(tpl.id)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-xs font-bold text-indigo-300 transition-all hover:bg-indigo-600 hover:text-white active:scale-95"
              >
                <span>Use Template</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
