import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Image as ImageIcon,
  Sparkles,
  Volume2,
  Clock,
  Film,
  Music,
  CheckCircle2,
  AlertCircle,
  Type,
  Key,
  HelpCircle,
  Sliders,
  Check,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Project, Scene, CaptionStyle } from '../types';
import { visualProvider } from '../services/providers/VisualProvider';
import { voiceProvider } from '../services/providers/VoiceProvider';
import { musicProvider } from '../services/providers/MusicProvider';
import { storageService } from '../services/storage';

interface TimelineProps {
  project: Project;
  scenes: Scene[];
  onUpdateScenes: (scenes: Scene[]) => void;
  onUpdateProject: (updates: Partial<Project>) => void;
  onStartRender: () => void;
  onBackToScript: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  scenes,
  onUpdateScenes,
  onUpdateProject,
  onStartRender,
  onBackToScript,
}) => {
  // Voice Generation & Playback State
  const [activePlayingAudioSceneId, setActivePlayingAudioSceneId] = useState<string | null>(null);
  const [generatingVoiceSceneId, setGeneratingVoiceSceneId] = useState<string | null>(null);
  const [isBatchGeneratingVoice, setIsBatchGeneratingVoice] = useState(false);
  const [batchVoiceProgress, setBatchVoiceProgress] = useState<{ current: number; total: number } | null>(null);
  const [showVoiceConfigModal, setShowVoiceConfigModal] = useState(false);
  const [targetSceneForConfig, setTargetSceneForConfig] = useState<Scene | null>(null);

  // Visuals & Music State
  const [generatingVisualSceneId, setGeneratingVisualSceneId] = useState<string | null>(null);
  const [isGeneratingAllVisuals, setIsGeneratingAllVisuals] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      voiceProvider.stopVoice();
    };
  }, []);

  // Compute Voice Readiness
  const voicesReadyCount = scenes.filter((s) => !!s.audioUrl || s.voiceStatus === 'ready').length;
  const visualsReadyCount = scenes.filter((s) => !!s.visualUrl).length;
  const totalDuration = scenes.reduce((sum, s) => sum + (s.audioDuration || s.duration), 0);

  // Play or Pause scene audio
  const handleTogglePlayAudio = async (scene: Scene) => {
    if (activePlayingAudioSceneId === scene.id) {
      voiceProvider.stopVoice();
      setActivePlayingAudioSceneId(null);
      return;
    }

    voiceProvider.stopVoice();
    setActivePlayingAudioSceneId(scene.id);

    if (scene.audioUrl) {
      // Play actual generated WAV audio
      await voiceProvider.playAudioUrl(scene.audioUrl, () => {
        setActivePlayingAudioSceneId(null);
      });
    } else {
      // Preview with speech synthesizer if audio is not yet generated
      await voiceProvider.previewVoice(scene.narration, project.voiceConfig, project.language);
      setActivePlayingAudioSceneId(null);
    }
  };

  // Generate Voice for a Single Scene
  const handleGenerateSingleVoice = async (scene: Scene, forceDemo = false) => {
    // Verify provider availability
    if (!forceDemo) {
      const isConfigured = await voiceProvider.isConfigured();
      if (!isConfigured) {
        setTargetSceneForConfig(scene);
        setShowVoiceConfigModal(true);
        return;
      }
    }

    setGeneratingVoiceSceneId(scene.id);

    // Update scene state to generating
    const intermediateScenes = scenes.map((s) =>
      s.id === scene.id ? { ...s, voiceStatus: 'generating' as const, voiceError: undefined } : s
    );
    onUpdateScenes(intermediateScenes);

    // Update project status to VOICE_GENERATING
    if (project.status !== 'VOICE_GENERATING') {
      const updatedProj: Partial<Project> = { status: 'VOICE_GENERATING' };
      onUpdateProject(updatedProj);
      storageService.saveProject({ ...project, ...updatedProj });
    }

    try {
      const result = await voiceProvider.generateSpeech({
        text: scene.narration,
        voiceConfig: project.voiceConfig,
        language: project.language,
        demoMode: forceDemo,
      });

      const updated = scenes.map((s) =>
        s.id === scene.id
          ? {
              ...s,
              audioUrl: result.audioUrl,
              audioDuration: result.duration,
              voice: project.voiceConfig.voiceId,
              language: project.language,
              speed: project.voiceConfig.speed,
              voiceStatus: 'ready' as const,
              voiceProvider: result.provider,
              isDemoAudio: result.isDemo,
              voiceError: undefined,
              status: 'ready' as const,
            }
          : s
      );

      onUpdateScenes(updated);
      storageService.saveProjectScenes(project.id, updated);

      // Check if all scenes have voices
      const allVoicesReady = updated.every((s) => !!s.audioUrl);
      if (allVoicesReady) {
        const finishedProj: Partial<Project> = { status: 'VOICE_READY' };
        onUpdateProject(finishedProj);
        storageService.saveProject({ ...project, ...finishedProj });
      }
    } catch (err: any) {
      const failedScenes = scenes.map((s) =>
        s.id === scene.id
          ? {
              ...s,
              voiceStatus: 'failed' as const,
              voiceError: err.message || 'Voice generation failed. Please retry.',
            }
          : s
      );
      onUpdateScenes(failedScenes);
      storageService.saveProjectScenes(project.id, failedScenes);
    } finally {
      setGeneratingVoiceSceneId(null);
    }
  };

  // Batch Generate Voice for All Scenes with Concurrency = 2
  const handleGenerateAllVoices = async (forceDemo = false) => {
    if (!forceDemo) {
      const isConfigured = await voiceProvider.isConfigured();
      if (!isConfigured) {
        setTargetSceneForConfig(null);
        setShowVoiceConfigModal(true);
        return;
      }
    }

    setIsBatchGeneratingVoice(true);
    setBatchVoiceProgress({ current: 0, total: scenes.length });

    // Update project status to VOICE_GENERATING
    const updatedProj: Partial<Project> = { status: 'VOICE_GENERATING' };
    onUpdateProject(updatedProj);
    storageService.saveProject({ ...project, ...updatedProj });

    let currentScenes = [...scenes];

    // Controlled concurrency queue (concurrency: 2)
    const concurrency = 2;
    let completedCount = 0;

    // Split scenes into chunks of 2
    for (let i = 0; i < currentScenes.length; i += concurrency) {
      const chunk = currentScenes.slice(i, i + concurrency);

      await Promise.all(
        chunk.map(async (sc) => {
          // Set scene to generating
          currentScenes = currentScenes.map((s) =>
            s.id === sc.id ? { ...s, voiceStatus: 'generating' as const, voiceError: undefined } : s
          );
          onUpdateScenes(currentScenes);

          try {
            const result = await voiceProvider.generateSpeech({
              text: sc.narration,
              voiceConfig: project.voiceConfig,
              language: project.language,
              demoMode: forceDemo,
            });

            currentScenes = currentScenes.map((s) =>
              s.id === sc.id
                ? {
                    ...s,
                    audioUrl: result.audioUrl,
                    audioDuration: result.duration,
                    voice: project.voiceConfig.voiceId,
                    language: project.language,
                    speed: project.voiceConfig.speed,
                    voiceStatus: 'ready' as const,
                    voiceProvider: result.provider,
                    isDemoAudio: result.isDemo,
                    voiceError: undefined,
                    status: 'ready' as const,
                  }
                : s
            );
          } catch (err: any) {
            currentScenes = currentScenes.map((s) =>
              s.id === sc.id
                ? {
                    ...s,
                    voiceStatus: 'failed' as const,
                    voiceError: err.message || 'Voice synthesis error',
                  }
                : s
            );
          } finally {
            completedCount++;
            setBatchVoiceProgress({ current: completedCount, total: currentScenes.length });
            onUpdateScenes(currentScenes);
            storageService.saveProjectScenes(project.id, currentScenes);
          }
        })
      );
    }

    // Finished batch
    setIsBatchGeneratingVoice(false);
    setBatchVoiceProgress(null);

    const allReady = currentScenes.every((s) => !!s.audioUrl);
    if (allReady) {
      const readyProj: Partial<Project> = { status: 'VOICE_READY' };
      onUpdateProject(readyProj);
      storageService.saveProject({ ...project, ...readyProj });
    }
  };

  // Generate visual for a single scene
  const handleGenerateVisual = async (scene: Scene) => {
    setGeneratingVisualSceneId(scene.id);
    try {
      const result = await visualProvider.generateSceneVisual(
        scene.visualPrompt,
        project.visualStyle,
        project.aspectRatio,
        scene.sceneNumber,
        project.topic
      );

      const updated = scenes.map((s) =>
        s.id === scene.id
          ? {
              ...s,
              visualUrl: result.url,
              visualType: result.type,
              visualProvider: result.provider,
              status: 'ready' as const,
            }
          : s
      );
      onUpdateScenes(updated);
      storageService.saveProjectScenes(project.id, updated);
    } finally {
      setGeneratingVisualSceneId(null);
    }
  };

  // Batch generate visuals
  const handleGenerateAllVisuals = async () => {
    setIsGeneratingAllVisuals(true);
    try {
      let current = [...scenes];
      for (const scene of current) {
        if (!scene.visualUrl) {
          const res = await visualProvider.generateSceneVisual(
            scene.visualPrompt,
            project.visualStyle,
            project.aspectRatio,
            scene.sceneNumber,
            project.topic
          );
          current = current.map((s) =>
            s.id === scene.id
              ? {
                  ...s,
                  visualUrl: res.url,
                  visualType: res.type,
                  visualProvider: res.provider,
                  status: 'ready' as const,
                }
              : s
          );
          onUpdateScenes(current);
          storageService.saveProjectScenes(project.id, current);
        }
      }
    } finally {
      setIsGeneratingAllVisuals(false);
    }
  };

  // Toggle background score preview
  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      musicProvider.stopPreview();
      setIsMusicPlaying(false);
    } else {
      musicProvider.startPreview(project.musicMood, project.musicVolume);
      setIsMusicPlaying(true);
    }
  };

  // Switch voice engine to Gemini 3.1 Flash AI Voice in settings
  const handleEnableGeminiVoice = () => {
    storageService.saveSettings({ ttsEngine: 'gemini' });
    setShowVoiceConfigModal(false);
    if (targetSceneForConfig) {
      handleGenerateSingleVoice(targetSceneForConfig, false);
      setTargetSceneForConfig(null);
    } else {
      handleGenerateAllVoices(false);
    }
  };

  // Continue in Demo Mode
  const handleContinueInDemoMode = () => {
    storageService.saveSettings({ ttsEngine: 'demo' });
    setShowVoiceConfigModal(false);
    if (targetSceneForConfig) {
      handleGenerateSingleVoice(targetSceneForConfig, true);
      setTargetSceneForConfig(null);
    } else {
      handleGenerateAllVoices(true);
    }
  };

  return (
    <div id="timeline-studio-container" className="space-y-6 pb-28">
      {/* Studio Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              STEP 3 OF 4
            </span>
            <span className="text-xs text-slate-400">Audio & Scene Synthesis</span>

            {/* Project Status Badge */}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                project.status === 'VOICE_READY'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : project.status === 'VOICE_GENERATING'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              }`}
            >
              {project.status === 'VOICE_READY'
                ? 'VOICE READY'
                : project.status === 'VOICE_GENERATING'
                ? 'GENERATING VOICE'
                : 'SCENES READY'}
            </span>
          </div>

          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">AI Voiceover & Scene Pipeline</h2>
          <p className="text-xs text-slate-400">
            {scenes.length} Scenes • ~{Math.round(totalDuration)}s Total •{' '}
            <span className={voicesReadyCount === scenes.length ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
              {voicesReadyCount}/{scenes.length} Voices Ready
            </span>{' '}
            • {visualsReadyCount}/{scenes.length} Visuals Ready
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBackToScript}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
          >
            Edit Script
          </button>

          {/* Generate All Voices Button */}
          <button
            id="generate-all-voices-btn"
            type="button"
            onClick={() => handleGenerateAllVoices(false)}
            disabled={isBatchGeneratingVoice}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold shadow-lg transition-all ${
              voicesReadyCount === scenes.length
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-indigo-500/60 bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30 active:scale-95'
            } disabled:opacity-50`}
          >
            <Sparkles className={`h-4 w-4 ${isBatchGeneratingVoice ? 'animate-spin' : ''}`} />
            <span>
              {isBatchGeneratingVoice
                ? `Generating voice ${batchVoiceProgress?.current || 1}/${batchVoiceProgress?.total || scenes.length}...`
                : voicesReadyCount === scenes.length
                ? 'Regenerate All Voices'
                : 'Generate All Voices'}
            </span>
          </button>

          {/* Generate All Visuals Button */}
          <button
            id="generate-all-visuals-btn"
            type="button"
            onClick={handleGenerateAllVisuals}
            disabled={isGeneratingAllVisuals}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <ImageIcon className={`h-4 w-4 ${isGeneratingAllVisuals ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Generate Visuals</span>
          </button>

          {/* Render Video Button */}
          <button
            id="start-render-btn"
            type="button"
            onClick={onStartRender}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
          >
            <Film className="h-4 w-4" />
            <span>Render Video</span>
          </button>
        </div>
      </div>

      {/* Batch Voice Progress Bar when generating */}
      {isBatchGeneratingVoice && batchVoiceProgress && (
        <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/40 p-4 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400 animate-spin" />
              Batch Synthesizing Scene Audio (Concurrency: 2)...
            </span>
            <span>
              {batchVoiceProgress.current} / {batchVoiceProgress.total} Complete (
              {Math.round((batchVoiceProgress.current / batchVoiceProgress.total) * 100)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
              style={{ width: `${(batchVoiceProgress.current / batchVoiceProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Voice Provider Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <span>Active Narrator: {project.voiceConfig.gender} ({project.language})</span>
              <span className="text-xs text-slate-400">• Speed: {project.voiceConfig.speed}x</span>
            </div>
            <p className="text-xs text-slate-400">
              Each scene narration generates dedicated synchronized audio. Base64 WAV data persists in project storage.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setTargetSceneForConfig(null);
            setShowVoiceConfigModal(true);
          }}
          className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Voice Provider Options</span>
        </button>
      </div>

      {/* Media Layer Controls: Captions & Music */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 lg:grid-cols-2">
        {/* Auto Captions Layer */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">Auto Captions Layer</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={project.captionsEnabled}
                onChange={(e) => onUpdateProject({ captionsEnabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {project.captionsEnabled && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Caption Visual Style:</div>
              <div className="flex flex-wrap gap-1.5">
                {(['Highlight', 'Bold', 'Clean', 'Cinematic', 'Minimal'] as CaptionStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateProject({ captionStyle: st })}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      project.captionStyle === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Music Layer Controls */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-slate-200">Background Score</span>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={project.backgroundMusicEnabled}
                onChange={(e) => onUpdateProject({ backgroundMusicEnabled: e.target.checked })}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
            </label>
          </div>

          {project.backgroundMusicEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300">
                  Mood: <span className="font-semibold text-amber-300">{project.musicMood}</span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    isMusicPlaying
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 animate-pulse'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isMusicPlaying ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                  <span>{isMusicPlaying ? 'Stop Preview' : 'Preview Score'}</span>
                </button>
              </div>

              {/* Volume */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Music Ducking Volume</span>
                  <span>{Math.round(project.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={project.musicVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateProject({ musicVolume: vol });
                    musicProvider.setVolume(vol);
                  }}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Scene Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Scene Sequencer & Audio Tracks</span>
            <span className="text-xs font-normal text-slate-400">({scenes.length} scenes)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Audio automatically persists to local project storage
          </span>
        </div>

        {/* Scene Cards Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => {
            const isPlayingThisAudio = activePlayingAudioSceneId === scene.id;
            const isGenThisVoice = generatingVoiceSceneId === scene.id;
            const isGenThisVisual = generatingVisualSceneId === scene.id;
            const hasAudio = !!scene.audioUrl;
            const isFailed = scene.voiceStatus === 'failed';
            const isDemo = scene.isDemoAudio === true;

            return (
              <div
                key={scene.id}
                id={`timeline-card-${scene.id}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-md transition-all hover:border-slate-700"
              >
                {/* Visual Thumbnail Top Area */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950 sm:aspect-[4/3]">
                  {scene.visualUrl ? (
                    <img
                      src={scene.visualUrl}
                      alt={scene.visualPrompt}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <ImageIcon className="h-8 w-8 text-slate-600 mb-2" />
                      <span className="text-xs text-slate-400">No visual generated</span>
                    </div>
                  )}

                  {/* Scene Number Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
                    <span>Scene {scene.sceneNumber}</span>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-medium text-slate-300 backdrop-blur-md">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>{scene.audioDuration ? `${scene.audioDuration}s` : `${scene.duration}s`}</span>
                  </div>

                  {/* Generate visual button */}
                  <button
                    type="button"
                    id={`regen-visual-btn-${scene.id}`}
                    onClick={() => handleGenerateVisual(scene)}
                    disabled={isGenThisVisual}
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 backdrop-blur-md transition-colors hover:bg-indigo-600 hover:text-white disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isGenThisVisual ? 'animate-spin' : ''}`} />
                    <span>{scene.visualUrl ? 'Regenerate' : 'Generate Visual'}</span>
                  </button>

                  {/* Caption badge */}
                  {scene.caption && (
                    <div className="absolute bottom-2 left-2 max-w-[60%] truncate rounded bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-black shadow-sm">
                      {scene.caption}
                    </div>
                  )}
                </div>

                {/* Narration Script Text */}
                <div className="flex flex-1 flex-col justify-between p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300">Narration Script:</span>
                      <span>{scene.narration.split(/\s+/).length} words</span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-slate-200">
                      "{scene.narration}"
                    </p>
                  </div>

                  {/* VOICE SECTION */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2.5">
                    {/* Voice Status Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-400">Audio Voice Track:</span>

                      {/* Status indicator */}
                      {isGenThisVoice ? (
                        <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300 animate-pulse">
                          <Sparkles className="h-3 w-3 animate-spin" />
                          <span>Generating Voice...</span>
                        </span>
                      ) : isFailed ? (
                        <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                          <AlertCircle className="h-3 w-3" />
                          <span>Voice Failed</span>
                        </span>
                      ) : hasAudio ? (
                        isDemo ? (
                          <span
                            className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300"
                            title="Configure TTS_API_KEY for real AI voice"
                          >
                            <span>Demo Mode Audio</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            <Sparkles className="h-3 w-3 text-emerald-400" />
                            <span>Real AI Voice</span>
                          </span>
                        )
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                          Not generated
                        </span>
                      )}
                    </div>

                    {/* Error message if failed */}
                    {isFailed && scene.voiceError && (
                      <div className="rounded-lg bg-rose-950/40 border border-rose-800/40 p-2 text-[11px] text-rose-200">
                        {scene.voiceError}
                      </div>
                    )}

                    {/* Audio Controls (Play/Pause, Generate/Regenerate, Retry) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      {/* Play / Pause button */}
                      <button
                        type="button"
                        id={`play-scene-audio-${scene.id}`}
                        onClick={() => handleTogglePlayAudio(scene)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                          isPlayingThisAudio
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 animate-pulse'
                            : hasAudio
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title={hasAudio ? 'Play generated audio track' : 'Preview voiceover'}
                      >
                        {isPlayingThisAudio ? (
                          <>
                            <Pause className="h-3 w-3 fill-current" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                            <span>{hasAudio ? 'Play Audio' : 'Preview'}</span>
                          </>
                        )}
                      </button>

                      {/* Generate / Regenerate / Retry button */}
                      {isFailed ? (
                        <button
                          type="button"
                          id={`retry-voice-${scene.id}`}
                          onClick={() => handleGenerateSingleVoice(scene)}
                          disabled={isGenThisVoice}
                          className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`generate-voice-${scene.id}`}
                          onClick={() => handleGenerateSingleVoice(scene)}
                          disabled={isGenThisVoice || isBatchGeneratingVoice}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            hasAudio
                              ? 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-white'
                              : 'border-indigo-500/60 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/80 font-bold'
                          } disabled:opacity-50`}
                        >
                          <Sparkles className={`h-3 w-3 ${isGenThisVoice ? 'animate-spin' : ''}`} />
                          <span>{hasAudio ? 'Regenerate' : 'Generate Voice'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0B0F17]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              voicesReadyCount === scenes.length
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-indigo-600/20 text-indigo-400'
            }`}
          >
            {voicesReadyCount === scenes.length ? <Check className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </div>
          <div>
            <div className="text-sm font-bold text-white">
              {voicesReadyCount === scenes.length ? 'All Audio Tracks Ready' : `${voicesReadyCount}/${scenes.length} Audio Tracks Ready`}
            </div>
            <div className="text-xs text-slate-400">
              Project Status: <span className="text-indigo-400 font-semibold">{project.status}</span> • Duration: ~
              {Math.round(totalDuration)}s
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voicesReadyCount < scenes.length && (
            <button
              type="button"
              onClick={() => handleGenerateAllVoices(false)}
              disabled={isBatchGeneratingVoice}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-indigo-500/50 bg-indigo-950/60 px-4 py-3 text-xs font-bold text-indigo-300 hover:bg-indigo-900/80 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate Remaining Voices</span>
            </button>
          )}

          <button
            id="floating-render-btn"
            type="button"
            onClick={onStartRender}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-600/35 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <Film className="h-4 w-4" />
            <span>Render Video (MP4)</span>
          </button>
        </div>
      </div>

      {/* Voice Provider Configuration / Demo Mode Modal */}
      {showVoiceConfigModal && (
        <div
          id="voice-config-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn"
        >
          <div
            id="voice-config-modal"
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                  <Volume2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Voice Provider Configuration</h3>
                  <p className="text-xs text-amber-300">Voice provider is not configured</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceConfigModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-300">
              A dedicated <code className="text-amber-300">TTS_API_KEY</code> environment variable was not detected.
              You can immediately generate real AI voice using the built-in Gemini 3.1 Flash AI Voice engine, or continue in Demo Mode.
            </p>

            {/* Option 1: Enable Gemini AI Voice */}
            <div
              onClick={handleEnableGeminiVoice}
              className="cursor-pointer rounded-2xl border border-indigo-500/40 bg-indigo-950/40 p-4 transition-all hover:border-indigo-500 hover:bg-indigo-900/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-bold text-white">Use Gemini 3.1 Flash AI Voice (Recommended)</span>
                </div>
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  Real AI Audio
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Generates studio-quality multi-lingual spoken voiceover via Google's Gemini audio modality model.
              </p>
            </div>

            {/* Option 2: Continue in Demo Mode */}
            <div
              onClick={handleContinueInDemoMode}
              className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-slate-700 hover:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">Continue in Demo Mode</span>
                </div>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Demo Audio
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-400">
                Generates lightweight synthesized speech waveforms. Clearly labeled in UI as Demo Mode Audio.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-500">
              <span>You can change this anytime in Settings.</span>
              <button
                type="button"
                onClick={() => setShowVoiceConfigModal(false)}
                className="rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
