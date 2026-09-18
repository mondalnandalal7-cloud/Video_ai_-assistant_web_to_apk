import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Clock,
  Globe,
  Film,
  Type,
  Music,
  Maximize2,
  Sliders,
  Check,
  Zap,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import {
  Language,
  VideoType,
  AspectRatio,
  DurationOption,
  ContentStyle,
  VisualStyle,
  MusicMood,
  VoiceConfig,
  CaptionStyle,
  CaptionPosition,
} from '../types';
import { VoiceSelector } from '../components/VoiceSelector';

export interface CreateVideoFormData {
  topic: string;
  language: Language;
  videoType: VideoType;
  aspectRatio: AspectRatio;
  duration: DurationOption;
  customDurationSeconds?: number;
  contentStyle: ContentStyle;
  customContentStyle?: string;
  visualStyle: VisualStyle;
  customVisualStyle?: string;
  voiceConfig: VoiceConfig;
  captions: boolean;
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  backgroundMusic: boolean;
  musicMood: MusicMood;
  musicVolume: number;
}

interface CreateVideoViewProps {
  initialData?: Partial<CreateVideoFormData>;
  onGenerate: (data: CreateVideoFormData) => void;
  isGenerating: boolean;
  generatingStage?: string;
  error?: string | null;
  onRetry?: () => void;
  onDismissError?: () => void;
}

export const CreateVideoView: React.FC<CreateVideoViewProps> = ({
  initialData,
  onGenerate,
  isGenerating,
  generatingStage = 'Analyzing topic...',
  error,
  onRetry,
  onDismissError,
}) => {
  const [formData, setFormData] = useState<CreateVideoFormData>({
    topic: initialData?.topic || '',
    language: initialData?.language || 'English',
    videoType: initialData?.videoType || 'YouTube Short',
    aspectRatio: initialData?.aspectRatio || '9:16',
    duration: initialData?.duration || '60 seconds',
    customDurationSeconds: 45,
    contentStyle: initialData?.contentStyle || 'Mystery',
    customContentStyle: '',
    visualStyle: initialData?.visualStyle || 'Cinematic',
    customVisualStyle: '',
    voiceConfig: initialData?.voiceConfig || {
      voiceId: 'male-deep-cinematic',
      gender: 'Male',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
    captions: initialData?.captions !== undefined ? initialData.captions : true,
    captionStyle: initialData?.captionStyle || 'Highlight',
    captionPosition: 'bottom-center',
    backgroundMusic:
      initialData?.backgroundMusic !== undefined ? initialData.backgroundMusic : true,
    musicMood: initialData?.musicMood || 'Suspense',
    musicVolume: 0.45,
  });

  const languages: Language[] = ['English', 'Hindi', 'Bengali', 'Tamil'];
  const videoTypes: VideoType[] = ['YouTube Short', 'Instagram Reel', 'TikTok', 'YouTube Video'];
  const aspectRatios: { id: AspectRatio; label: string; desc: string; icon: string }[] = [
    { id: '9:16', label: '9:16 (Vertical)', desc: 'Shorts, Reels & TikTok', icon: '📱' },
    { id: '16:9', label: '16:9 (Horizontal)', desc: 'Standard YouTube Video', icon: '🖥️' },
    { id: '1:1', label: '1:1 (Square)', desc: 'Instagram & Feed Posts', icon: '⏹️' },
  ];
  const durations: DurationOption[] = ['30 seconds', '60 seconds', '90 seconds', '3 minutes', 'Custom'];
  const contentStyles: ContentStyle[] = [
    'Documentary',
    'Storytelling',
    'Motivational',
    'Facts',
    'Mystery',
    'History',
    'Horror',
    'News-style',
    'Educational',
    'Top 5 / Top 10',
    'Custom',
  ];
  const visualStyles: VisualStyle[] = [
    'Cinematic',
    'Realistic',
    'Dark',
    'Documentary',
    'AI Art',
    'Minimal',
    'Custom',
  ];
  const musicMoods: MusicMood[] = [
    'Cinematic',
    'Emotional',
    'Suspense',
    'Motivational',
    'Calm',
    'Energetic',
  ];

  const sampleTopics = [
    '5 mysterious places in India',
    'What happens when a black hole collides with a neutron star',
    'The ancient lost city buried beneath the Amazon rainforest',
    '3 psychological secrets that make people instantly respect you',
    'The 1977 signal from space that was never explained',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic.trim()) {
      alert('Please enter a video topic.');
      return;
    }
    onGenerate(formData);
  };

  return (
    <form
      id="create-video-form"
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-8 pb-32"
    >
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            AI STUDIO PIPELINE
          </span>
          <span className="text-xs text-slate-400">Step 1: Configuration</span>
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Create New Faceless Video
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Enter your topic and customize your video narrative, voiceover, visual direction, and soundscape.
        </p>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          id="generation-error-alert"
          className="rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 sm:p-5 shadow-lg shadow-rose-950/20 text-rose-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-rose-500/20 p-2 text-rose-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white">Video Script Generation Notice</h4>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed">{error}</p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {onRetry && (
                    <button
                      id="retry-generate-btn"
                      type="button"
                      onClick={onRetry}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 active:scale-95 transition-all shadow"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                  {onDismissError && (
                    <button
                      type="button"
                      onClick={onDismissError}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 active:scale-95 transition-all"
                    >
                      <span>Dismiss</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close error notice"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* GENERATING SEQUENCE BANNER */}
      {isGenerating && (
        <div
          id="script-generation-progress"
          className="rounded-3xl border border-indigo-500/30 bg-indigo-950/40 backdrop-blur-md p-6 sm:p-7 shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Generating Video Project</h3>
                <p className="text-xs text-indigo-300">Processing topic with Gemini scriptwriter & director</p>
              </div>
            </div>
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 animate-pulse">
              IN PROGRESS
            </span>
          </div>

          {/* Sequential 4-Step Loading List */}
          <div className="space-y-2.5">
            {[
              { label: 'Analyzing topic...' },
              { label: 'Writing script...' },
              { label: 'Creating scenes...' },
              { label: 'Saving project...' },
            ].map((step, idx) => {
              const stages = ['Analyzing topic...', 'Writing script...', 'Creating scenes...', 'Saving project...'];
              const currentIndex = stages.indexOf(generatingStage);
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex || (currentIndex === -1 && idx === 0);

              return (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                    isCurrent
                      ? 'border border-indigo-500/40 bg-indigo-500/15 text-white shadow-sm'
                      : isPast
                      ? 'text-emerald-400 bg-emerald-500/5'
                      : 'text-slate-500 bg-slate-900/30'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-700 mx-1 shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm font-medium ${isCurrent ? 'font-bold text-white' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. TOPIC CARD */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-200">
            <Zap className="h-4 w-4 text-indigo-400" />
            Video Topic / Concept
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            What should this video be about? Be as specific or broad as you like.
          </p>
        </div>

        <textarea
          id="topic-input"
          rows={3}
          required
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-4 text-base font-medium text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. 5 mysterious places in India where science cannot explain what happens..."
        />

        {/* Quick topic suggestion chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quick Inspo Prompts:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setFormData({ ...formData, topic })}
                className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-indigo-500 hover:text-white"
              >
                + {topic}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. FORMAT & SPECIFICATIONS */}
      <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 lg:grid-cols-2">
        {/* Language */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-indigo-400" />
            Language
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                id={`lang-btn-${lang.toLowerCase()}`}
                onClick={() => setFormData({ ...formData, language: lang })}
                className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                  formData.language === lang
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Video Platform Type */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Film className="h-4 w-4 text-indigo-400" />
            Video Destination
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {videoTypes.map((type) => (
              <button
                key={type}
                type="button"
                id={`video-type-${type.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => {
                  const autoAspect: AspectRatio = type === 'YouTube Video' ? '16:9' : '9:16';
                  setFormData({ ...formData, videoType: type, aspectRatio: autoAspect });
                }}
                className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                  formData.videoType === type
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Cards */}
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Maximize2 className="h-4 w-4 text-indigo-400" />
            Aspect Ratio
          </label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {aspectRatios.map((item) => (
              <div
                key={item.id}
                id={`aspect-btn-${item.id.replace(':', '-')}`}
                onClick={() => setFormData({ ...formData, aspectRatio: item.id })}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                  formData.aspectRatio === item.id
                    ? 'border-indigo-500 bg-indigo-950/40 text-white ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-sm font-bold text-slate-100">{item.label}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{item.desc}</p>
                </div>
                {formData.aspectRatio === item.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            Video Duration
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {durations.map((dur) => (
              <button
                key={dur}
                type="button"
                id={`duration-btn-${dur.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setFormData({ ...formData, duration: dur })}
                className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                  formData.duration === dur
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. CONTENT & VISUAL STYLE */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 space-y-6">
        {/* Content Style */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-400" />
            Script & Narrative Style
          </label>
          <div className="flex flex-wrap gap-2">
            {contentStyles.map((style) => (
              <button
                key={style}
                type="button"
                id={`style-btn-${style.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}
                onClick={() => setFormData({ ...formData, contentStyle: style })}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  formData.contentStyle === style
                    ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
          {formData.contentStyle === 'Custom' && (
            <input
              type="text"
              value={formData.customContentStyle || ''}
              onChange={(e) => setFormData({ ...formData, customContentStyle: e.target.value })}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Describe custom tone (e.g., Satirical sci-fi with dark humor)..."
            />
          )}
        </div>

        {/* Visual Style */}
        <div className="space-y-2 border-t border-slate-800/80 pt-4">
          <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            AI Visual Aesthetics
          </label>
          <div className="flex flex-wrap gap-2">
            {visualStyles.map((vs) => (
              <button
                key={vs}
                type="button"
                id={`visual-btn-${vs.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => setFormData({ ...formData, visualStyle: vs })}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  formData.visualStyle === vs
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
              >
                {vs}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. VOICE CONFIGURATION */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
        <VoiceSelector
          value={formData.voiceConfig}
          onChange={(voiceConfig) => setFormData({ ...formData, voiceConfig })}
        />
      </div>

      {/* 5. CAPTIONS & MUSIC OPTIONS */}
      <div className="grid grid-cols-1 gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7 lg:grid-cols-2">
        {/* Captions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Type className="h-4 w-4 text-indigo-400" />
              Dynamic On-Screen Captions
            </label>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="toggle-captions"
                checked={formData.captions}
                onChange={(e) => setFormData({ ...formData, captions: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Burn synchronized high-contrast captions into the video frames to maximize viewer retention.
          </p>
        </div>

        {/* Music */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <Music className="h-4 w-4 text-amber-400" />
              Background Music
            </label>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                id="toggle-music"
                checked={formData.backgroundMusic}
                onChange={(e) => setFormData({ ...formData, backgroundMusic: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-800 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {formData.backgroundMusic && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Music Mood:</div>
              <div className="flex flex-wrap gap-1.5">
                {musicMoods.map((mood) => (
                  <button
                    key={mood}
                    type="button"
                    onClick={() => setFormData({ ...formData, musicMood: mood })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      formData.musicMood === mood
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="sticky bottom-20 z-30 pt-2 space-y-2">
        {error && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/30 bg-rose-950/80 backdrop-blur-md px-4 py-2.5 text-xs text-rose-300 shadow-lg">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span className="truncate">{error}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="shrink-0 flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 font-bold text-white hover:bg-rose-500 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
        <button
          id="generate-video-btn"
          type="submit"
          disabled={isGenerating}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-base font-black uppercase tracking-wider text-white shadow-2xl shadow-indigo-600/40 transition-all hover:from-indigo-500 hover:to-indigo-400 active:scale-[0.99] disabled:opacity-50"
        >
          <Sparkles className={`h-5 w-5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? (generatingStage ? generatingStage.toUpperCase() : 'GENERATING SCRIPT & SCENES...') : 'GENERATE VIDEO'}</span>
        </button>
      </div>
    </form>
  );
};
