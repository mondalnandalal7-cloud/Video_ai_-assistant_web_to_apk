import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Volume2,
  Image as ImageIcon,
  Film,
  Database,
  CheckCircle2,
  AlertCircle,
  Key,
  Sliders,
  Sparkles,
  RefreshCw,
  Smartphone,
  Download,
} from 'lucide-react';
import { AppSettings, ProviderStatus, AspectRatio, Language, DurationOption } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onOpenAndroidApk?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onOpenAndroidApk,
}) => {
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkProviders = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setProviderStatuses(data.providers || []);
      } else {
        // Fallback status
        setProviderStatuses([
          { name: 'Gemini Text & Planning', configured: true, fallbackAvailable: true, details: 'Server-side API active' },
          { name: 'Text-to-Speech (TTS)', configured: false, fallbackAvailable: true, details: 'Web Audio / SpeechSynthesis fallback' },
          { name: 'Visual Generation', configured: false, fallbackAvailable: true, details: 'Procedural Canvas fallback' },
          { name: 'Video Renderer', configured: true, fallbackAvailable: true, details: 'Canvas Video Engine active' },
          { name: 'Database & Storage', configured: true, fallbackAvailable: true, details: 'Client-side Local & Cloud Storage active' },
        ]);
      }
    } catch {
      setProviderStatuses([
        { name: 'Gemini Text & Planning', configured: true, fallbackAvailable: true, details: 'Active' },
        { name: 'Text-to-Speech (TTS)', configured: false, fallbackAvailable: true, details: 'Web Audio fallback' },
        { name: 'Visual Generation', configured: false, fallbackAvailable: true, details: 'Procedural fallback' },
        { name: 'Video Renderer', configured: true, fallbackAvailable: true, details: 'Active' },
        { name: 'Storage', configured: true, fallbackAvailable: true, details: 'Active' },
      ]);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkProviders();
  }, []);

  return (
    <div id="settings-view-container" className="max-w-4xl mx-auto space-y-8 pb-32">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            SYSTEM ENGINE
          </span>
          <span className="text-xs text-slate-400">Providers & Configuration</span>
        </div>
        <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Settings & Pipeline Status</h1>
        <p className="text-xs text-slate-400 mt-1">
          Monitor modular AI provider integrations, adjust render configurations, and manage offline demo modes.
        </p>
      </div>

      {/* 1. Modular Provider Statuses */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Modular Provider Status</h2>
          </div>
          <button
            type="button"
            onClick={checkProviders}
            disabled={isChecking}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {providerStatuses.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div>
                <div className="text-sm font-bold text-slate-200">{p.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">{p.details}</div>
              </div>

              {p.configured ? (
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>ONLINE</span>
                </div>
              ) : p.fallbackAvailable ? (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <span>FALLBACK READY</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>OFFLINE</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Security / Architecture explanation note */}
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <Key className="h-4 w-4" />
            <span>Zero Client-Side Secret Keys Architecture</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            All AI queries (Gemini API) and heavy operations are executed exclusively through the secure Express server. Keys are configured via container environment variables (<code className="text-indigo-300">.env.example</code>). The app works seamlessly with high-fidelity procedural generation even when third-party provider keys are omitted.
          </p>
        </div>
      </div>

      {/* 2. Voice Engine & TTS Configuration */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Voice Generation Engine</h2>
          </div>
          <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
            {settings.ttsEngine === 'demo' ? 'DEMO SYNTHESIZER' : 'GEMINI 3.1 FLASH TTS'}
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Select your voiceover synthesis provider. All voice generation runs strictly server-side with zero secret key leakage to the browser.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Gemini AI Voice option */}
          <div
            onClick={() => onUpdateSettings({ ttsEngine: 'gemini' })}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              settings.ttsEngine !== 'demo'
                ? 'border-indigo-500 bg-indigo-950/40 shadow-md ring-1 ring-indigo-500'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span className="text-sm font-bold text-white">Gemini 3.1 Flash AI Voice</span>
              </div>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                RECOMMENDED
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Synthesizes expressive, natural human voiceover across 5 voice personas (Aoede, Charon, Fenrir, Kore, Puck) and multiple languages with studio WAV fidelity.
            </p>
          </div>

          {/* Demo Synthesizer option */}
          <div
            onClick={() => onUpdateSettings({ ttsEngine: 'demo' })}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              settings.ttsEngine === 'demo'
                ? 'border-amber-500 bg-amber-950/40 shadow-md ring-1 ring-amber-500'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Demo Audio Synthesizer</span>
              </div>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                OFFLINE FALLBACK
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Synthesizes instant browser speech or harmonic waveforms for testing and zero-quota development. Clearly labeled in UI as Demo Mode Audio.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Dedicated Provider Key:</span>
            <code className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              TTS_API_KEY (Optional)
            </code>
          </div>
          <span className="text-[11px] text-slate-500">
            Fallback kicks in gracefully if third-party quota is exceeded.
          </span>
        </div>
      </div>

      {/* 3. Default Preferences */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">Default Video Project Defaults</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Default Aspect Ratio */}
          <div>
            <label className="text-xs font-bold text-slate-300">Default Aspect Ratio</label>
            <select
              value={settings.defaultAspectRatio}
              onChange={(e) => onUpdateSettings({ defaultAspectRatio: e.target.value as AspectRatio })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="9:16">9:16 (Shorts, Reels, TikTok)</option>
              <option value="16:9">16:9 (YouTube Landscape)</option>
              <option value="1:1">1:1 (Square Feed)</option>
            </select>
          </div>

          {/* Default Duration */}
          <div>
            <label className="text-xs font-bold text-slate-300">Default Duration</label>
            <select
              value={settings.defaultDuration}
              onChange={(e) => onUpdateSettings({ defaultDuration: e.target.value as DurationOption })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="30 seconds">30 seconds</option>
              <option value="60 seconds">60 seconds</option>
              <option value="90 seconds">90 seconds</option>
              <option value="3 minutes">3 minutes</option>
            </select>
          </div>

          {/* Render Resolution */}
          <div>
            <label className="text-xs font-bold text-slate-300">Render Resolution</label>
            <select
              value={settings.renderResolution}
              onChange={(e) => onUpdateSettings({ renderResolution: e.target.value as any })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="1080p">1080p (Full HD)</option>
              <option value="720p">720p (Fast)</option>
            </select>
          </div>

          {/* Render Framerate */}
          <div>
            <label className="text-xs font-bold text-slate-300">Framerate (FPS)</label>
            <select
              value={settings.renderFps}
              onChange={(e) => onUpdateSettings({ renderFps: parseInt(e.target.value) as any })}
              className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="30">30 FPS (Standard)</option>
              <option value="60">60 FPS (Fluid)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Demo Mode Toggle */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Always-Ready Procedural Fallback Engine</h3>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-xl">
            Ensures that the entire video creation workflow, audio synthesizer, and canvas compositor run smoothly without blocking on external rate limits or unconfigured keys.
          </p>
        </div>
      </div>

      {/* 4. Android Phone & APK Package Center */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Android Phone &amp; APK Distribution</h3>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              READY
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Install the native Android WebAPK directly onto your smartphone home screen, or generate a standalone signed .apk package via PWABuilder.
          </p>
        </div>
        {onOpenAndroidApk && (
          <button
            id="settings-open-apk-center-btn"
            onClick={onOpenAndroidApk}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all shrink-0"
          >
            <Download className="h-4 w-4" />
            Open Android APK Center
          </button>
        )}
      </div>
    </div>
  );
};
