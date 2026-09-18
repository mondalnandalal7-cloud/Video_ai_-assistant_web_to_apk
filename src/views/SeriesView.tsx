import React, { useState } from 'react';
import {
  Tv,
  Plus,
  Sparkles,
  Play,
  Pause,
  Trash2,
  Calendar,
  Layers,
  Clock,
  Globe,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Series,
  Language,
  ContentStyle,
  VisualStyle,
  DurationOption,
  VoiceConfig,
} from '../types';
import { VoiceSelector } from '../components/VoiceSelector';

interface SeriesViewProps {
  seriesList: Series[];
  onSaveSeries: (series: Series) => void;
  onDeleteSeries: (seriesId: string) => void;
  onGenerateNextVideo: (series: Series) => void;
  isGeneratingNext?: boolean;
}

export const SeriesView: React.FC<SeriesViewProps> = ({
  seriesList,
  onSaveSeries,
  onDeleteSeries,
  onGenerateNextVideo,
  isGeneratingNext,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  // New series form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    niche: string;
    language: Language;
    videoStyle: ContentStyle;
    visualStyle: VisualStyle;
    defaultDuration: DurationOption;
    postingFrequency: string;
    voice: VoiceConfig;
  }>({
    name: '',
    description: '',
    niche: '',
    language: 'English',
    videoStyle: 'Mystery',
    visualStyle: 'Dark',
    defaultDuration: '60 seconds',
    postingFrequency: 'Daily',
    voice: {
      voiceId: 'male-deep-cinematic',
      gender: 'Male',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
  });

  const openCreateModal = () => {
    setEditingSeries(null);
    setFormData({
      name: '',
      description: '',
      niche: '',
      language: 'English',
      videoStyle: 'Mystery',
      visualStyle: 'Dark',
      defaultDuration: '60 seconds',
      postingFrequency: 'Daily',
      voice: {
        voiceId: 'male-deep-cinematic',
        gender: 'Male',
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (series: Series) => {
    setEditingSeries(series);
    setFormData({
      name: series.name,
      description: series.description,
      niche: series.niche,
      language: series.language,
      videoStyle: series.videoStyle,
      visualStyle: series.visualStyle,
      defaultDuration: series.defaultDuration,
      postingFrequency: series.postingFrequency,
      voice: series.voice,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const toSave: Series = {
      id: editingSeries ? editingSeries.id : `series_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      niche: formData.niche,
      language: formData.language,
      videoStyle: formData.videoStyle,
      visualStyle: formData.visualStyle,
      defaultDuration: formData.defaultDuration,
      postingFrequency: formData.postingFrequency,
      voice: formData.voice,
      status: editingSeries ? editingSeries.status : 'active',
      episodeCount: editingSeries ? editingSeries.episodeCount : 0,
      topicsHistory: editingSeries ? editingSeries.topicsHistory : [],
      createdAt: editingSeries ? editingSeries.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSaveSeries(toSave);
    setIsModalOpen(false);
  };

  const toggleSeriesStatus = (series: Series) => {
    const updated: Series = {
      ...series,
      status: series.status === 'active' ? 'paused' : 'active',
      updatedAt: Date.now(),
    };
    onSaveSeries(updated);
  };

  return (
    <div id="series-view-container" className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-purple-500/20 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
              CHANNEL AUTOMATION
            </span>
            <span className="text-xs text-slate-400">Recurring Content Engines</span>
          </div>
          <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Series System</h1>
          <p className="text-xs text-slate-400">
            Automate ongoing faceless YouTube Shorts or Reels series with consistent persona and themes.
          </p>
        </div>

        <button
          id="create-series-btn"
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Create Series</span>
        </button>
      </div>

      {/* Series Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {seriesList.map((series) => {
          const isActive = series.status === 'active';

          return (
            <div
              key={series.id}
              id={`series-card-${series.id}`}
              className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg transition-all hover:border-purple-500/50"
            >
              <div>
                {/* Top Status & Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isActive ? 'ACTIVE CAMPAIGN' : 'PAUSED'}
                    </span>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      {series.postingFrequency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSeriesStatus(series)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                      title={isActive ? 'Pause Series' : 'Resume Series'}
                    >
                      {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(series)}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete series "${series.name}"?`)) {
                          onDeleteSeries(series.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Series Title & Description */}
                <h3 className="mt-3 text-xl font-bold text-white">{series.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{series.description}</p>

                {/* Parameters Pill Grid */}
                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                    Niche: <strong className="text-white">{series.niche}</strong>
                  </span>
                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                    Language: <strong className="text-white">{series.language}</strong>
                  </span>
                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                    Style: <strong className="text-white">{series.videoStyle}</strong>
                  </span>
                  <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-slate-300">
                    Duration: <strong className="text-white">{series.defaultDuration}</strong>
                  </span>
                </div>

                {/* Recent Topic History */}
                <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Recent Episodes ({series.topicsHistory.length})</span>
                    <span className="text-[10px] text-slate-500">Auto-tracked</span>
                  </div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {series.topicsHistory.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-300 truncate"
                      >
                        <span className="text-[10px] font-bold text-purple-400">#{idx + 1}</span>
                        <span className="truncate">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* One-Click Generate Next Video Action */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  id={`gen-next-series-${series.id}`}
                  onClick={() => onGenerateNextVideo(series)}
                  disabled={isGeneratingNext}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-500 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className={`h-4 w-4 ${isGeneratingNext ? 'animate-spin' : ''}`} />
                  <span>GENERATE NEXT VIDEO</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Series Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0C101A] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingSeries ? 'Edit Series System' : 'Create Automated Series'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name & Niche */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-300">Series Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Dark Mystery Files"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Niche Category</label>
                  <input
                    type="text"
                    required
                    value={formData.niche}
                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                    placeholder="e.g. Unexplained Mysteries"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Target audience & content direction..."
                />
              </div>

              {/* Language & Posting Frequency */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-slate-300">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Tamil">Tamil</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Posting Cadence</label>
                  <select
                    value={formData.postingFrequency}
                    onChange={(e) => setFormData({ ...formData, postingFrequency: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="3x a week">3x a week</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Voice Selector */}
              <div className="border-t border-slate-800 pt-4">
                <VoiceSelector
                  value={formData.voice}
                  onChange={(voice) => setFormData({ ...formData, voice })}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500"
                >
                  {editingSeries ? 'Save Changes' : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
