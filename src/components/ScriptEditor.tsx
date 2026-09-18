import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Clock,
  Image as ImageIcon,
  MessageSquare,
  Zap,
  Save,
  ChevronRight,
  Sliders,
  Volume2,
} from 'lucide-react';
import { Project, Scene } from '../types';
import { aiProvider } from '../services/providers/AIProvider';

interface ScriptEditorProps {
  project: Project;
  scenes: Scene[];
  onUpdateProject: (updated: Partial<Project>) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
  onRegenerateAll: () => Promise<void>;
  onContinue: () => void;
  onSaveDraft: () => void;
  isGenerating: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  project,
  scenes,
  onUpdateProject,
  onUpdateScenes,
  onRegenerateAll,
  onContinue,
  onSaveDraft,
  isGenerating,
}) => {
  const [regeneratingSceneId, setRegeneratingSceneId] = useState<string | null>(null);

  // Total calculated duration
  const totalDuration = scenes.reduce((acc, s) => acc + (s.duration || 5), 0);

  // Update a single scene field
  const updateScene = (id: string, updates: Partial<Scene>) => {
    const next = scenes.map((s) => (s.id === id ? { ...s, ...updates } : s));
    onUpdateScenes(next);
  };

  // Reorder scene
  const moveScene = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === scenes.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const next = [...scenes];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    // Recalculate scene numbers
    const renumbered = next.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(renumbered);
  };

  // Delete scene
  const deleteScene = (id: string) => {
    if (scenes.length <= 2) {
      alert('A faceless video requires at least 2 scenes.');
      return;
    }
    const filtered = scenes.filter((s) => s.id !== id);
    const renumbered = filtered.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(renumbered);
  };

  // Add scene
  const addScene = (afterIndex?: number) => {
    const insertIdx = afterIndex !== undefined ? afterIndex + 1 : scenes.length;
    const newScene: Scene = {
      id: `sc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      projectId: project.id,
      sceneNumber: insertIdx + 1,
      duration: 5,
      narration: `Notice what happens when we look closer at this detail.`,
      visualPrompt: `Dramatic cinematic shot continuing the topic ${project.topic}, ${project.visualStyle} aesthetic, high definition.`,
      caption: 'PAY ATTENTION HERE',
      transition: 'fast zoom-in',
      soundEffect: 'subtle whoosh',
      status: 'pending',
    };

    const next = [...scenes];
    next.splice(insertIdx, 0, newScene);
    const renumbered = next.map((s, idx) => ({ ...s, sceneNumber: idx + 1 }));
    onUpdateScenes(renumbered);
  };

  // Regenerate a single scene with AI
  const handleRegenerateScene = async (scene: Scene) => {
    setRegeneratingSceneId(scene.id);
    try {
      const refreshed = await aiProvider.regenerateScene(scene, project.topic, project.visualStyle, project.language);
      updateScene(scene.id, refreshed);
    } catch (err: any) {
      alert(err?.message || 'Failed to regenerate scene');
    } finally {
      setRegeneratingSceneId(null);
    }
  };

  return (
    <div id="script-editor-container" className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-400">
              STEP 2 OF 4
            </span>
            <span className="text-xs text-slate-400">Structured Script & Scene Breakdown</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Refine Script & Visual Prompts</h2>
          <p className="text-xs text-slate-400">
            {scenes.length} scenes generated • Total duration: ~{totalDuration}s
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="regenerate-script-btn"
            type="button"
            onClick={onRegenerateAll}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Regenerate Script</span>
          </button>

          <button
            id="save-draft-btn"
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save Draft</span>
          </button>

          <button
            id="continue-to-studio-btn"
            type="button"
            onClick={onContinue}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
          >
            <span>Continue to Studio</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title & Hook Card */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 shadow-sm">
        {/* Title */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Project Title
          </label>
          <input
            id="project-title-input"
            type="text"
            value={project.title}
            onChange={(e) => onUpdateProject({ title: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-semibold text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Viral Video Title..."
          />
        </div>

        {/* 3-Second Hook */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Opening 3-Second Hook (High Retention)
              </label>
            </div>
            <span className="text-[11px] text-amber-400/80">First 0-3 seconds</span>
          </div>
          <textarea
            id="project-hook-input"
            rows={2}
            value={project.hook || ''}
            onChange={(e) => onUpdateProject({ hook: e.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-700/80 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            placeholder="The explosive sentence that stops people from scrolling away..."
          />
        </div>

        {/* Description & Hashtags */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Video Description & Viral Hashtags
          </label>
          <input
            id="project-description-input"
            type="text"
            value={project.description || ''}
            onChange={(e) => onUpdateProject({ description: e.target.value })}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none"
            placeholder="Short description with viral hashtags..."
          />
        </div>
      </div>

      {/* Scene List Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Scene Breakdown</span>
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {scenes.length}
          </span>
        </h3>

        <button
          id="add-scene-top-btn"
          type="button"
          onClick={() => addScene()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Scene</span>
        </button>
      </div>

      {/* Editable Scene Cards List */}
      <div className="space-y-4">
        {scenes.map((scene, index) => {
          const isRegen = regeneratingSceneId === scene.id;

          return (
            <div
              key={scene.id}
              id={`scene-editor-card-${scene.id}`}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 sm:p-5"
            >
              {/* Scene Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-xs font-bold text-indigo-400">
                    {scene.sceneNumber}
                  </div>
                  <span className="text-sm font-semibold text-slate-200">
                    Scene {scene.sceneNumber}
                  </span>
                  {index === 0 && (
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      HOOK SCENE
                    </span>
                  )}
                </div>

                {/* Controls: Duration, Reorder, Delete, Regenerate */}
                <div className="flex items-center gap-2">
                  {/* Duration input */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="number"
                      min="2"
                      max="15"
                      value={scene.duration}
                      onChange={(e) =>
                        updateScene(scene.id, { duration: Math.max(2, parseInt(e.target.value) || 4) })
                      }
                      className="w-8 bg-transparent text-center font-bold text-white focus:outline-none"
                    />
                    <span>sec</span>
                  </div>

                  {/* Reorder Up */}
                  <button
                    type="button"
                    onClick={() => moveScene(index, 'up')}
                    disabled={index === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move scene earlier"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  {/* Reorder Down */}
                  <button
                    type="button"
                    onClick={() => moveScene(index, 'down')}
                    disabled={index === scenes.length - 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Move scene later"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  {/* Regenerate single scene */}
                  <button
                    type="button"
                    onClick={() => handleRegenerateScene(scene)}
                    disabled={isRegen}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-indigo-400 disabled:opacity-40"
                    title="Regenerate scene content"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRegen ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  {/* Delete scene */}
                  <button
                    type="button"
                    onClick={() => deleteScene(scene.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400"
                    title="Delete scene"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Scene Content Grid: Narration & Visual Prompt */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Voice Narration */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                      Narration Voiceover
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {scene.narration.split(/\s+/).length} words
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={scene.narration}
                    onChange={(e) => updateScene(scene.id, { narration: e.target.value })}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    placeholder="Enter narration text for voice synthesis..."
                  />
                </div>

                {/* Visual Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <ImageIcon className="h-3.5 w-3.5 text-cyan-400" />
                      AI Visual Prompt
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Style: {project.visualStyle}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={scene.visualPrompt}
                    onChange={(e) => updateScene(scene.id, { visualPrompt: e.target.value })}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                    placeholder="Detailed visual prompt for AI image/video generator..."
                  />
                </div>
              </div>

              {/* Scene Footer Metadata: Caption text, Sound effect, Transition */}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 pt-3 border-t border-slate-800/60">
                {/* On-screen Caption text */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">On-Screen Caption</label>
                  <input
                    type="text"
                    value={scene.caption || ''}
                    onChange={(e) => updateScene(scene.id, { caption: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-300 focus:border-indigo-500 focus:outline-none uppercase"
                    placeholder="KEY HIGHLIGHT WORDS"
                  />
                </div>

                {/* Transition */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Transition Effect</label>
                  <input
                    type="text"
                    value={scene.transition || 'fast zoom-in'}
                    onChange={(e) => updateScene(scene.id, { transition: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. whip pan, zoom-in"
                  />
                </div>

                {/* Sound effect */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400">Audio SFX Cue</label>
                  <input
                    type="text"
                    value={scene.soundEffect || 'whoosh riser'}
                    onChange={(e) => updateScene(scene.id, { soundEffect: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                    placeholder="e.g. bass drop, clock tick"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Scene Bottom Button */}
      <div className="flex justify-center pt-2">
        <button
          id="add-scene-bottom-btn"
          type="button"
          onClick={() => addScene()}
          className="flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-3 text-sm font-semibold text-slate-300 hover:border-indigo-500 hover:bg-slate-900 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Scene</span>
        </button>
      </div>

      {/* Floating Bottom Action Bar for Mobile & Desktop */}
      <div className="sticky bottom-20 z-20 flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0B0F17]/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 font-bold">
            {scenes.length}
          </div>
          <div>
            <div className="text-sm font-bold text-white">Timeline Ready</div>
            <div className="text-xs text-slate-400">Total duration: ~{totalDuration} seconds</div>
          </div>
        </div>

        <button
          id="continue-to-studio-floating-btn"
          type="button"
          onClick={onContinue}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 active:scale-95"
        >
          <span>Continue to Studio</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
