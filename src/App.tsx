import React, { useState, useEffect, useRef } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { ScriptEditor } from './components/ScriptEditor';
import { Timeline } from './components/Timeline';
import { VideoPlayer } from './components/VideoPlayer';
import { RenderModal } from './components/RenderModal';
import { AndroidApkModal } from './components/AndroidApkModal';

import { DashboardView } from './views/DashboardView';
import { CreateVideoView, CreateVideoFormData } from './views/CreateVideoView';
import { MyVideosView } from './views/MyVideosView';
import { SeriesView } from './views/SeriesView';
import { TemplatesView } from './views/TemplatesView';
import { SettingsView } from './views/SettingsView';

import { Project, Scene, Series, Template, AppSettings } from './types';
import { storageService } from './services/storage';
import { aiProvider } from './services/providers/AIProvider';
import { videoRenderer } from './services/providers/VideoRenderer';
import { visualProvider } from './services/providers/VisualProvider';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeSubView, setActiveSubView] = useState<'none' | 'script-editor' | 'studio' | 'preview'>('none');
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Stored Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());

  // Active Project & Scenes
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentScenes, setCurrentScenes] = useState<Scene[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | undefined>(undefined);

  // Form pre-fill data (e.g. from Template or Series)
  const [createFormInitial, setCreateFormInitial] = useState<Partial<CreateVideoFormData> | undefined>(undefined);

  // Loading & Generation Flags & Stages
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatingStage, setGeneratingStage] = useState<string>('Analyzing topic...');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingSeriesNext, setIsGeneratingSeriesNext] = useState(false);
  const lastSubmittedFormDataRef = useRef<CreateVideoFormData | null>(null);

  // Render Engine Modal State
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStageMessage, setRenderStageMessage] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);

  // Initialize data from local storage service
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setProjects(storageService.getProjects());
    setSeriesList(storageService.getSeries());
    setTemplates(storageService.getTemplates());
    setSettings(storageService.getSettings());
  };

  // Switch to specific project
  const handleOpenProject = (projectId: string) => {
    const proj = storageService.getProject(projectId);
    if (!proj) return;

    const scenes = storageService.getProjectScenes(projectId);
    setCurrentProject(proj);
    setCurrentScenes(scenes);
    setVideoBlobUrl(proj.videoUrl || undefined);

    if (proj.status === 'completed' || proj.status === 'VIDEO_GENERATED') {
      setActiveSubView('preview');
    } else if (proj.status === 'scripted' || proj.status === 'SCENES_READY') {
      setActiveSubView('studio');
    } else {
      setActiveSubView('script-editor');
    }
  };

  // Create Video Submit Handler: calls Gemini AI to generate full script & scenes with explicit status flow
  const handleGenerateVideoSubmit = async (data: CreateVideoFormData) => {
    lastSubmittedFormDataRef.current = data;
    setGenerationError(null);
    setIsGeneratingScript(true);
    setGeneratingStage('Analyzing topic...');

    const projectId = `proj_${Date.now()}`;
    const initialProject: Project = {
      id: projectId,
      userId: 'user-default',
      title: data.topic,
      topic: data.topic,
      language: data.language,
      videoType: data.videoType,
      aspectRatio: data.aspectRatio,
      duration: data.duration,
      customDurationSeconds: data.customDurationSeconds,
      contentStyle: data.contentStyle,
      customContentStyle: data.customContentStyle,
      visualStyle: data.visualStyle,
      customVisualStyle: data.customVisualStyle,
      voiceConfig: data.voiceConfig,
      captionsEnabled: data.captions,
      captionStyle: data.captionStyle,
      captionPosition: data.captionPosition,
      backgroundMusicEnabled: data.backgroundMusic,
      musicMood: data.musicMood,
      musicVolume: data.musicVolume,
      status: 'CREATING',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDemo: false,
    };

    // Save initial state in storage
    storageService.saveProject(initialProject);
    loadAllData();

    try {
      // Stage 1: Analyzing topic...
      setGeneratingStage('Analyzing topic...');
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Stage 2: Writing script... (Gemini call)
      setGeneratingStage('Writing script...');
      const { plan, isDemo } = await aiProvider.generateScriptPlan({
        topic: data.topic,
        language: data.language,
        videoType: data.videoType,
        aspectRatio: data.aspectRatio,
        duration: data.duration,
        customDurationSeconds: data.customDurationSeconds,
        contentStyle: data.contentStyle,
        customContentStyle: data.customContentStyle,
        visualStyle: data.visualStyle,
        customVisualStyle: data.customVisualStyle,
        voiceConfig: data.voiceConfig,
      });

      // Update project with real generated content and SCRIPTED status
      const scriptedProject: Project = {
        ...initialProject,
        title: plan.title || data.topic,
        hook: plan.hook,
        description: plan.description,
        status: 'SCRIPTED',
        isDemo,
        updatedAt: Date.now(),
      };
      storageService.saveProject(scriptedProject);

      // Stage 3: Creating scenes...
      setGeneratingStage('Creating scenes...');
      const mappedScenes: Scene[] = plan.scenes.map((s, idx) => ({
        id: `sc_${projectId}_${idx + 1}`,
        projectId,
        sceneNumber: idx + 1,
        duration: s.duration || 5,
        narration: s.narration,
        visualPrompt: s.visualPrompt,
        caption: s.caption || '',
        transition: s.transition || 'fast zoom-in',
        soundEffect: s.soundEffect || 'whoosh riser',
        status: 'ready',
      }));

      // Pre-generate the first scene visual for immediate responsive playback
      try {
        if (mappedScenes[0]) {
          const firstVisual = await visualProvider.generateSceneVisual(
            mappedScenes[0].visualPrompt,
            scriptedProject.visualStyle,
            scriptedProject.aspectRatio,
            1,
            scriptedProject.topic
          );
          mappedScenes[0].visualUrl = firstVisual.url;
          mappedScenes[0].visualType = firstVisual.type;
          mappedScenes[0].visualProvider = firstVisual.provider;
        }
      } catch {
        // Continue if background visual pregeneration encounters a hiccup
      }

      // Stage 4: Saving project... (SCENES_READY status)
      setGeneratingStage('Saving project...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      const readyProject: Project = {
        ...scriptedProject,
        status: 'SCENES_READY',
        updatedAt: Date.now(),
      };

      // Persist in storage
      storageService.saveProject(readyProject);
      storageService.saveProjectScenes(projectId, mappedScenes);

      setCurrentProject(readyProject);
      setCurrentScenes(mappedScenes);
      loadAllData();

      // Advance directly to Scene Editor
      setActiveSubView('script-editor');
    } catch (err: any) {
      // Clean up project from CREATING status if failed
      storageService.deleteProject(projectId);
      loadAllData();
      const errorMessage = err?.message || 'Error communicating with Gemini API. Please retry.';
      setGenerationError(errorMessage);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRetryGeneration = () => {
    if (lastSubmittedFormDataRef.current) {
      handleGenerateVideoSubmit(lastSubmittedFormDataRef.current);
    }
  };

  // Regenerate all script scenes with AI
  const handleRegenerateAllScript = async () => {
    if (!currentProject) return;
    setIsGeneratingScript(true);
    try {
      const { plan } = await aiProvider.generateScriptPlan({
        topic: currentProject.topic,
        language: currentProject.language,
        videoType: currentProject.videoType,
        aspectRatio: currentProject.aspectRatio,
        duration: currentProject.duration as any,
        contentStyle: currentProject.contentStyle,
        visualStyle: currentProject.visualStyle,
        voiceConfig: currentProject.voiceConfig,
      });

      const updatedProj: Project = {
        ...currentProject,
        title: plan.title,
        hook: plan.hook,
        description: plan.description,
        updatedAt: Date.now(),
      };

      const updatedScenes: Scene[] = plan.scenes.map((s, idx) => ({
        id: `sc_${currentProject.id}_${idx + 1}`,
        projectId: currentProject.id,
        sceneNumber: idx + 1,
        duration: s.duration || 5,
        narration: s.narration,
        visualPrompt: s.visualPrompt,
        caption: s.caption || '',
        transition: s.transition || 'fast zoom-in',
        soundEffect: s.soundEffect || 'whoosh riser',
        status: 'pending',
      }));

      storageService.saveProject(updatedProj);
      storageService.saveProjectScenes(currentProject.id, updatedScenes);
      setCurrentProject(updatedProj);
      setCurrentScenes(updatedScenes);
      loadAllData();
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Render Full Video Pipeline
  const handleRenderFullVideo = async () => {
    if (!currentProject || currentScenes.length === 0) return;

    setIsRendering(true);
    setRenderProgress(0);
    setRenderStageMessage('Initializing rendering pipeline...');
    setRenderError(null);

    try {
      // Ensure all scenes have visuals before composite rendering
      const scenesWithVisuals = [...currentScenes];
      for (let i = 0; i < scenesWithVisuals.length; i++) {
        if (!scenesWithVisuals[i].visualUrl) {
          const v = await visualProvider.generateSceneVisual(
            scenesWithVisuals[i].visualPrompt,
            currentProject.visualStyle,
            currentProject.aspectRatio,
            scenesWithVisuals[i].sceneNumber,
            currentProject.topic
          );
          scenesWithVisuals[i].visualUrl = v.url;
          scenesWithVisuals[i].visualType = v.type;
        }
      }
      setCurrentScenes(scenesWithVisuals);
      storageService.saveProjectScenes(currentProject.id, scenesWithVisuals);

      // Trigger video renderer
      const result = await videoRenderer.renderVideo(
        currentProject,
        scenesWithVisuals,
        {
          resolution: settings.renderResolution,
          fps: settings.renderFps,
          format: 'mp4',
        },
        (progress, stage) => {
          setRenderProgress(progress);
          setRenderStageMessage(stage);
        }
      );

      // Update project status to completed
      const completedProj: Project = {
        ...currentProject,
        status: 'VIDEO_GENERATED',
        videoUrl: result.videoUrl,
        renderedDuration: result.duration,
        updatedAt: Date.now(),
      };

      storageService.saveProject(completedProj);
      setCurrentProject(completedProj);
      setVideoBlobUrl(result.videoUrl);
      loadAllData();

      // Brief delay to allow 100% checkmark to be appreciated
      setTimeout(() => {
        setIsRendering(false);
        setActiveSubView('preview');
      }, 700);
    } catch (err: any) {
      setRenderError(err.message || 'Rendering failed');
    }
  };

  // Generate Next Episode in a Series
  const handleGenerateNextSeriesVideo = async (series: Series) => {
    setIsGeneratingSeriesNext(true);
    try {
      // AI suggests next topic based on history
      const nextTopicData = await aiProvider.generateNextSeriesTopic(series);
      const nextTopic = nextTopicData.topic;

      // Create Video Form Data automatically from series configuration
      const autoData: CreateVideoFormData = {
        topic: nextTopic,
        language: series.language,
        videoType: 'YouTube Short',
        aspectRatio: '9:16',
        duration: series.defaultDuration,
        contentStyle: series.videoStyle,
        visualStyle: series.visualStyle,
        voiceConfig: series.voice,
        captions: true,
        captionStyle: 'Highlight',
        captionPosition: 'bottom-center',
        backgroundMusic: true,
        musicMood: 'Suspense',
        musicVolume: 0.45,
      };

      // Update series history
      const updatedSeries: Series = {
        ...series,
        episodeCount: series.episodeCount + 1,
        topicsHistory: [nextTopic, ...series.topicsHistory],
        updatedAt: Date.now(),
      };
      storageService.saveSeries(updatedSeries);

      // Run generation
      await handleGenerateVideoSubmit(autoData);
    } finally {
      setIsGeneratingSeriesNext(false);
    }
  };

  // Use Template action: pre-fill create form
  const handleUseTemplate = (templateId: string) => {
    const tpl = storageService.getTemplateById(templateId);
    if (!tpl) return;

    setCreateFormInitial({
      topic: `${tpl.name} about `,
      contentStyle: tpl.scriptStyle,
      visualStyle: tpl.visualStyle,
      captionStyle: tpl.captionStyle,
      musicMood: tpl.musicMood,
      duration: tpl.defaultDuration,
      aspectRatio: tpl.aspectRatio,
      captions: true,
      backgroundMusic: true,
    });

    setActiveTab('create');
    setActiveSubView('none');
  };

  // Navigation tab click handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setActiveSubView('none');
    if (tab === 'create') {
      setCreateFormInitial(undefined);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#080B11] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header & Mobile Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDemoMode={true}
        onOpenAndroidApk={() => setIsApkModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8">
        {/* SUBVIEWS (Script Editor, Studio Timeline, Video Preview) */}
        {activeSubView === 'script-editor' && currentProject ? (
          <ScriptEditor
            project={currentProject}
            scenes={currentScenes}
            onUpdateProject={(updates) => {
              const next = { ...currentProject, ...updates };
              setCurrentProject(next);
              storageService.saveProject(next);
            }}
            onUpdateScenes={(scenes) => {
              setCurrentScenes(scenes);
              storageService.saveProjectScenes(currentProject.id, scenes);
            }}
            onRegenerateAll={handleRegenerateAllScript}
            onContinue={() => {
              const updatedProj: Project = { ...currentProject, status: 'scripted' };
              setCurrentProject(updatedProj);
              storageService.saveProject(updatedProj);
              setActiveSubView('studio');
            }}
            onSaveDraft={() => {
              storageService.saveProject(currentProject);
              storageService.saveProjectScenes(currentProject.id, currentScenes);
              alert('Draft saved to My Videos!');
            }}
            isGenerating={isGeneratingScript}
          />
        ) : activeSubView === 'studio' && currentProject ? (
          <Timeline
            project={currentProject}
            scenes={currentScenes}
            onUpdateScenes={(scenes) => {
              setCurrentScenes(scenes);
              storageService.saveProjectScenes(currentProject.id, scenes);
            }}
            onUpdateProject={(updates) => {
              const next = { ...currentProject, ...updates };
              setCurrentProject(next);
              storageService.saveProject(next);
            }}
            onStartRender={handleRenderFullVideo}
            onBackToScript={() => setActiveSubView('script-editor')}
          />
        ) : activeSubView === 'preview' && currentProject ? (
          <VideoPlayer
            project={currentProject}
            scenes={currentScenes}
            videoBlobUrl={videoBlobUrl}
            onEdit={() => setActiveSubView('script-editor')}
            onRegenerate={handleRenderFullVideo}
            onDelete={() => {
              if (confirm('Delete this video project?')) {
                storageService.deleteProject(currentProject.id);
                loadAllData();
                setActiveSubView('none');
                setActiveTab('videos');
              }
            }}
            onSave={() => {
              storageService.saveProject(currentProject);
              alert('Project saved!');
            }}
          />
        ) : (
          /* PRIMARY TAB VIEWS */
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                projects={projects}
                seriesList={seriesList}
                templates={templates}
                onCreateClick={() => {
                  setCreateFormInitial(undefined);
                  setActiveTab('create');
                }}
                onOpenProject={handleOpenProject}
                onOpenSeries={(seriesId) => setActiveTab('series')}
                onUseTemplate={handleUseTemplate}
                onGenerateNextSeriesVideo={handleGenerateNextSeriesVideo}
                isDemoMode={true}
              />
            )}

            {activeTab === 'create' && (
              <CreateVideoView
                initialData={createFormInitial}
                onGenerate={handleGenerateVideoSubmit}
                isGenerating={isGeneratingScript}
                generatingStage={generatingStage}
                error={generationError}
                onRetry={handleRetryGeneration}
                onDismissError={() => setGenerationError(null)}
              />
            )}

            {activeTab === 'videos' && (
              <MyVideosView
                projects={projects}
                onOpenProject={handleOpenProject}
                onEditProject={(id) => {
                  handleOpenProject(id);
                  setActiveSubView('script-editor');
                }}
                onRegenerateProject={(id) => {
                  handleOpenProject(id);
                  handleRenderFullVideo();
                }}
                onDeleteProject={(id) => {
                  storageService.deleteProject(id);
                  loadAllData();
                }}
                onCreateClick={() => {
                  setCreateFormInitial(undefined);
                  setActiveTab('create');
                }}
              />
            )}

            {activeTab === 'series' && (
              <SeriesView
                seriesList={seriesList}
                onSaveSeries={(series) => {
                  storageService.saveSeries(series);
                  loadAllData();
                }}
                onDeleteSeries={(id) => {
                  storageService.deleteSeries(id);
                  loadAllData();
                }}
                onGenerateNextVideo={handleGenerateNextSeriesVideo}
                isGeneratingNext={isGeneratingSeriesNext}
              />
            )}

            {activeTab === 'templates' && (
              <TemplatesView
                templates={templates}
                onUseTemplate={handleUseTemplate}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={(updates) => {
                  storageService.saveSettings(updates);
                  setSettings(storageService.getSettings());
                }}
                onOpenAndroidApk={() => setIsApkModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Render Progress Modal */}
      <RenderModal
        isOpen={isRendering}
        progress={renderProgress}
        stageMessage={renderStageMessage}
        error={renderError}
        onCancel={() => setIsRendering(false)}
      />

      {/* Android Phone & APK Download / WebAPK Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </div>
  );
}
