import React, { useState } from 'react';
import { Volume2, VolumeX, Play, Square, Sparkles } from 'lucide-react';
import { VoiceConfig, VoiceOption } from '../types';
import { voiceProvider } from '../services/providers/VoiceProvider';

interface VoiceSelectorProps {
  value: VoiceConfig;
  onChange: (updated: VoiceConfig) => void;
  onGenerateVoice?: () => void;
  isGeneratingVoice?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  value,
  onChange,
  onGenerateVoice,
  isGeneratingVoice = false,
}) => {
  const voices = voiceProvider.getAvailableVoices();
  const [isPlayingId, setIsPlayingId] = useState<string | null>(null);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<'All' | 'Male' | 'Female'>('All');

  const filteredVoices = voices.filter(
    (v) => selectedGenderFilter === 'All' || v.gender === selectedGenderFilter
  );

  const handlePreview = async (voice: VoiceOption) => {
    if (isPlayingId === voice.id) {
      voiceProvider.stopVoice();
      setIsPlayingId(null);
      return;
    }

    setIsPlayingId(voice.id);
    const sample =
      voice.language === 'Hindi'
        ? 'नमस्ते, यह आपके वीडियो के लिए एआई वॉयस ओवर का पूर्वावलोकन है।'
        : voice.language === 'Bengali'
        ? 'নমস্কার, এটি আপনার ভিডিওর জন্য তৈরি একটি ভয়েস প্রিভিউ।'
        : voice.language === 'Tamil'
        ? 'வணக்கம், இது உங்கள் வீடியோவிற்கான குரல் மாதிரியாகும்.'
        : `This is a voice preview for your faceless video. Pay close attention to what happens next.`;

    await voiceProvider.previewVoice(sample, {
      ...value,
      voiceId: voice.id,
      gender: voice.gender,
    });
    setIsPlayingId(null);
  };

  const speedPresets = [0.75, 1.0, 1.25, 1.5];

  return (
    <div id="voice-selector-container" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-slate-200">Narrator Voice & Delivery</label>
          <p className="text-xs text-slate-400">Select persona & adjust timbre and pace</p>
        </div>

        {/* Gender Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
          {(['All', 'Male', 'Female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenderFilter(g)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                selectedGenderFilter === g
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Voice cards grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filteredVoices.map((v) => {
          const isSelected = value.voiceId === v.id;
          const isPlaying = isPlayingId === v.id;

          return (
            <div
              key={v.id}
              id={`voice-card-${v.id}`}
              onClick={() =>
                onChange({
                  ...value,
                  voiceId: v.id,
                  gender: v.gender,
                })
              }
              className={`relative flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/30 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">{v.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      v.gender === 'Male'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {v.gender}
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                    {v.language}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{v.tone}</p>
              </div>

              {/* Preview voice button */}
              <button
                type="button"
                id={`preview-voice-btn-${v.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreview(v);
                }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  isPlaying
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300 animate-pulse'
                    : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
                }`}
                title="Preview voice tone"
              >
                {isPlaying ? <Square className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Voice Sliders & Presets: Speed, Pitch, Volume */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-4">
        {/* Speed presets */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span className="font-semibold">Speech Speed Pace</span>
            <div className="flex items-center gap-1.5">
              {speedPresets.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  onClick={() => onChange({ ...value, speed: sp })}
                  className={`rounded px-2 py-0.5 text-[11px] font-bold transition-colors ${
                    Math.abs(value.speed - sp) < 0.04
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>
          <input
            id="voice-speed-slider"
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={value.speed}
            onChange={(e) => onChange({ ...value, speed: parseFloat(e.target.value) })}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-slate-800/60">
          {/* Pitch */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span>Pitch: {value.pitch.toFixed(2)}</span>
              <span className="text-slate-500">Timbre</span>
            </div>
            <input
              id="voice-pitch-slider"
              type="range"
              min="0.75"
              max="1.3"
              step="0.05"
              value={value.pitch}
              onChange={(e) => onChange({ ...value, pitch: parseFloat(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
            />
          </div>

          {/* Volume */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span>Volume: {Math.round(value.volume * 100)}%</span>
              <span className="text-slate-500">Master</span>
            </div>
            <input
              id="voice-volume-slider"
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={value.volume}
              onChange={(e) => onChange({ ...value, volume: parseFloat(e.target.value) })}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-indigo-500"
            />
          </div>
        </div>

        {onGenerateVoice && (
          <div className="pt-2 border-t border-slate-800/60 flex justify-end">
            <button
              type="button"
              onClick={onGenerateVoice}
              disabled={isGeneratingVoice}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingVoice ? 'animate-spin' : ''}`} />
              <span>{isGeneratingVoice ? 'Generating AI Voice...' : 'Generate Voice'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
