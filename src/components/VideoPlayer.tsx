import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Edit3,
  Trash2,
  Share2,
  Check,
  Maximize2,
  Clock,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Project, Scene } from '../types';
import { voiceProvider } from '../services/providers/VoiceProvider';
import { musicProvider } from '../services/providers/MusicProvider';
import { visualProvider } from '../services/providers/VisualProvider';

interface VideoPlayerProps {
  project: Project;
  scenes: Scene[];
  videoBlobUrl?: string;
  onEdit: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onSave: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  scenes,
  videoBlobUrl,
  onEdit,
  onRegenerate,
  onDelete,
  onSave,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 - 1
  const [isMuted, setIsMuted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const playbackTimerRef = useRef<any>(null);
  const progressTimerRef = useRef<any>(null);

  const currentScene = scenes[currentSceneIdx] || scenes[0];
  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

  // Compute active scene visual, falling back cleanly to procedural generator
  const activeVisualUrl = currentScene?.visualUrl || (typeof window !== 'undefined' ? visualProvider.createProceduralVisual(
    currentScene?.visualPrompt || project.topic,
    project.visualStyle,
    project.aspectRatio,
    currentScene?.sceneNumber || 1,
    project.topic
  ) : '');

  // Playback engine
  useEffect(() => {
    if (!isPlaying) {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      voiceProvider.stopVoice();
      musicProvider.stopPreview();
      return;
    }

    // Start background music if enabled
    if (project.backgroundMusicEnabled && !isMuted) {
      musicProvider.startPreview(project.musicMood, project.musicVolume);
    }

    // Play active scene narration
    if (currentScene && !isMuted) {
      voiceProvider.previewVoice(currentScene.narration, project.voiceConfig);
    }

    const sceneDurationMs = (currentScene?.duration || 4) * 1000;
    const startTime = Date.now();

    // Smooth progress counter
    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(1, elapsed / sceneDurationMs);
      setSceneProgress(pct);
    }, 50);

    // Advance to next scene
    playbackTimerRef.current = setTimeout(() => {
      if (currentSceneIdx < scenes.length - 1) {
        setCurrentSceneIdx((prev) => prev + 1);
        setSceneProgress(0);
      } else {
        // Video finished
        setIsPlaying(false);
        setCurrentSceneIdx(0);
        setSceneProgress(0);
      }
    }, sceneDurationMs);

    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlaying, currentSceneIdx, isMuted]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      voiceProvider.stopVoice();
      musicProvider.stopPreview();
    };
  }, []);

  // Trigger file download
  const handleDownload = () => {
    const urlToDownload = videoBlobUrl || activeVisualUrl;
    if (!urlToDownload) return;

    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'faceless_video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const isPortrait = project.aspectRatio === '9:16';
  const isSquare = project.aspectRatio === '1:1';

  return (
    <div id="video-preview-wrapper" className="space-y-6 pb-24">
      {/* Player Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
              VIDEO PREVIEW
            </span>
            <span className="text-xs text-slate-400">Rendered & Synchronized</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">{project.title}</h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalDuration}s Duration
            </span>
            <span>•</span>
            <span>Format: {project.aspectRatio}</span>
            <span>•</span>
            <span>Resolution: 1080x1920 (HD)</span>
            <span>•</span>
            <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Primary Download and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="download-video-btn"
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95"
          >
            {downloadSuccess ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Video (MP4)'}</span>
          </button>

          <button
            id="edit-scenes-btn"
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <button
            id="regenerate-video-btn"
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Regenerate</span>
          </button>

          <button
            id="delete-video-btn"
            type="button"
            onClick={onDelete}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:border-rose-900"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Futuristic Video Player Stage */}
      <div className="flex flex-col items-center justify-center">
        <div
          id="player-container"
          className={`relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-black shadow-2xl ${
            isPortrait
              ? 'w-full max-w-[360px] aspect-[9/16]'
              : isSquare
              ? 'w-full max-w-[500px] aspect-square'
              : 'w-full max-w-[720px] aspect-[16/9]'
          }`}
        >
          {/* Visual Scene Canvas / Image */}
          {activeVisualUrl ? (
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={activeVisualUrl}
                alt={currentScene?.visualPrompt || 'Scene visual'}
                className="h-full w-full object-cover transition-transform duration-1000 ease-out"
                style={{
                  transform: isPlaying ? `scale(${1 + sceneProgress * 0.08})` : 'scale(1)',
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-600">
              No visual frame
            </div>
          )}

          {/* Vignette & Cinematic Lighting Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />

          {/* Top Progress Segment Bars for Scenes */}
          <div className="absolute top-3 left-3 right-3 z-10 flex gap-1.5">
            {scenes.map((s, idx) => {
              const isPast = idx < currentSceneIdx;
              const isCurrent = idx === currentSceneIdx;

              return (
                <div
                  key={s.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25 backdrop-blur-sm"
                >
                  <div
                    className="h-full bg-indigo-400 transition-all duration-100"
                    style={{
                      width: isPast ? '100%' : isCurrent ? `${sceneProgress * 100}%` : '0%',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Info Bar */}
          <div className="absolute top-6 left-4 right-4 z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                Scene {currentSceneIdx + 1}/{scenes.length}
              </span>
              <span className="rounded-md bg-indigo-500/80 px-2 py-0.5 text-[10px] font-bold text-white">
                {project.videoType}
              </span>
            </div>

            {/* Mute button */}
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Dynamic On-Screen Captions (Styled) */}
          {project.captionsEnabled && currentScene?.caption && (
            <div className="absolute bottom-16 left-4 right-4 z-10 text-center">
              {project.captionStyle === 'Highlight' ? (
                <div className="inline-block rounded-lg bg-amber-400 px-3.5 py-1.5 text-base font-black tracking-wide text-black shadow-xl sm:text-lg">
                  {currentScene.caption}
                </div>
              ) : project.captionStyle === 'Bold' ? (
                <div className="inline-block rounded-xl bg-black/80 px-4 py-2 text-base font-black tracking-wider text-white shadow-2xl border border-white/10 sm:text-lg">
                  {currentScene.caption}
                </div>
              ) : project.captionStyle === 'Cinematic' ? (
                <div className="inline-block text-sm font-serif font-bold tracking-widest text-slate-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] sm:text-base">
                  {currentScene.caption}
                </div>
              ) : (
                <div className="inline-block text-base font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:text-lg">
                  {currentScene.caption}
                </div>
              )}
            </div>
          )}

          {/* Big Center Play/Pause Overlay */}
          <button
            type="button"
            id="center-play-pause-btn"
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-xl backdrop-blur-md">
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-1" />
              )}
            </div>
          </button>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between">
            <button
              type="button"
              id="player-play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 rounded-lg bg-black/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-black"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <div className="text-[11px] font-medium text-slate-300">
              {Math.round(
                scenes.slice(0, currentSceneIdx).reduce((a, b) => a + b.duration, 0) +
                  sceneProgress * (currentScene?.duration || 4)
              )}
              s / {totalDuration}s
            </div>
          </div>
        </div>

        {/* Video Summary Card */}
        <div className="mt-6 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between font-semibold text-slate-200">
            <span>Video Synopsis</span>
            <span className="text-indigo-400">{project.contentStyle} • {project.visualStyle}</span>
          </div>
          <p className="leading-relaxed text-slate-300">{project.description || project.hook}</p>
        </div>
      </div>
    </div>
  );
};
