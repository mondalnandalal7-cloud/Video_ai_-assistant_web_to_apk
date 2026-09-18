import React from 'react';
import {
  Sparkles,
  Film,
  FolderPlus,
  Tv,
  Clock,
  ArrowRight,
  Play,
  TrendingUp,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Layers,
} from 'lucide-react';
import { Project, Series, Template } from '../types';

interface DashboardViewProps {
  projects: Project[];
  seriesList: Series[];
  templates: Template[];
  onCreateClick: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenSeries: (seriesId: string) => void;
  onUseTemplate: (templateId: string) => void;
  onGenerateNextSeriesVideo: (series: Series) => void;
  isDemoMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  seriesList,
  templates,
  onCreateClick,
  onOpenProject,
  onOpenSeries,
  onUseTemplate,
  onGenerateNextSeriesVideo,
  isDemoMode,
}) => {
  const totalProjects = projects.length;
  const completedVideos = projects.filter((p) => p.status === 'completed').length;
  const draftProjects = projects.filter((p) => p.status === 'draft' || p.status === 'scripted').length;
  const activeSeriesCount = seriesList.filter((s) => s.status === 'active').length;

  const recentProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const featuredSeries = seriesList[0];

  return (
    <div id="dashboard-view-container" className="space-y-8 pb-24">
      {/* First Run / Welcome Banner */}
      <div
        id="dashboard-hero-banner"
        className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-[#0B0F17] p-6 shadow-2xl sm:p-8"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              Automated AI Pipeline
            </span>
            {isDemoMode && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                DEMO MODE ACTIVE
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Create Viral Faceless Videos in Seconds
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
            Turn any topic into an automated YouTube Short, Instagram Reel, or TikTok with AI scriptwriting, dynamic scenes, voiceover, and auto-captions.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="hero-create-btn"
              type="button"
              onClick={onCreateClick}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Create New Video</span>
            </button>

            {featuredSeries && (
              <button
                type="button"
                onClick={() => onGenerateNextSeriesVideo(featuredSeries)}
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 active:scale-95"
              >
                <Tv className="h-4 w-4 text-indigo-400" />
                <span>Next Episode: {featuredSeries.name}</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Projects */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderPlus className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{totalProjects}</div>
          <p className="mt-1 text-[11px] text-slate-500">Video campaigns created</p>
        </div>

        {/* Videos Generated */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Videos Generated</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{completedVideos}</div>
          <p className="mt-1 text-[11px] text-slate-500">Ready for export & sharing</p>
        </div>

        {/* Drafts */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Drafts</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{draftProjects}</div>
          <p className="mt-1 text-[11px] text-slate-500">Scripts & scene pipelines</p>
        </div>

        {/* Series */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Automated Series</span>
            <Tv className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white sm:text-3xl">{activeSeriesCount}</div>
          <p className="mt-1 text-[11px] text-slate-500">Niches on auto-pilot</p>
        </div>
      </div>

      {/* Series Automation Spotlight Card */}
      {featuredSeries && (
        <div
          id="series-spotlight-card"
          className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
                  AUTOMATED SERIES
                </span>
                <span className="text-xs text-slate-400">{featuredSeries.postingFrequency}</span>
              </div>
              <h3 className="text-lg font-bold text-white sm:text-xl">{featuredSeries.name}</h3>
              <p className="text-xs text-slate-300 line-clamp-1">{featuredSeries.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenSeries(featuredSeries.id)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                View Series
              </button>
              <button
                type="button"
                onClick={() => onGenerateNextSeriesVideo(featuredSeries)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Next Episode</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Templates Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Popular Templates</h2>
            <p className="text-xs text-slate-400">Pre-configured styles, soundscapes & caption typography</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              id={`template-card-${tpl.id}`}
              onClick={() => onUseTemplate(tpl.id)}
              className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-indigo-500/60 hover:bg-slate-900"
            >
              <div>
                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                  {tpl.scriptStyle}
                </span>
                <h4 className="mt-2 text-sm font-bold text-white group-hover:text-indigo-400">
                  {tpl.name}
                </h4>
                <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{tpl.description}</p>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                <span>{tpl.defaultDuration}</span>
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">Use →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Videos Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Projects</h2>
            <p className="text-xs text-slate-400">Jump back into your recent faceless productions</p>
          </div>

          <button
            type="button"
            onClick={onCreateClick}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            <span>Create New</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/20 p-12 text-center">
            <Film className="h-10 w-10 text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">No videos yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Enter your first topic and let the automated engine generate your full faceless video.
            </p>
            <button
              type="button"
              onClick={onCreateClick}
              className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500"
            >
              Start First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentProjects.map((p) => (
              <div
                key={p.id}
                id={`recent-project-card-${p.id}`}
                onClick={() => onOpenProject(p.id)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 transition-all hover:border-indigo-500/50 hover:shadow-xl"
              >
                {/* Thumbnail Area */}
                <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent z-10" />
                  <div className="flex h-full w-full items-center justify-center bg-indigo-950/20 text-indigo-400">
                    <Film className="h-8 w-8 opacity-40 group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Status badge */}
                  <div className="absolute top-2 left-2 z-20">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : p.status === 'generating'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2 z-20 text-[10px] text-slate-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-md">
                    {p.duration}
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <h4 className="line-clamp-1 text-sm font-bold text-white group-hover:text-indigo-400">
                      {p.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                      {p.topic}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
                    <span>{p.language}</span>
                    <span className="font-semibold text-indigo-400 group-hover:underline">Open Studio →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
