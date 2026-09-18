/**
 * Data models and provider interface types for AI Studio Faceless Video
 */

export type Language = 'English' | 'Hindi' | 'Bengali' | 'Tamil';

export type VideoType = 'YouTube Short' | 'Instagram Reel' | 'TikTok' | 'YouTube Video';

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type DurationOption = '30 seconds' | '60 seconds' | '90 seconds' | '3 minutes' | 'Custom';

export type ContentStyle =
  | 'Documentary'
  | 'Storytelling'
  | 'Motivational'
  | 'Facts'
  | 'Mystery'
  | 'History'
  | 'Horror'
  | 'News-style'
  | 'Educational'
  | 'Top 5 / Top 10'
  | 'Custom';

export type VisualStyle =
  | 'Cinematic'
  | 'Realistic'
  | 'Dark'
  | 'Documentary'
  | 'AI Art'
  | 'Minimal'
  | 'Custom';

export type CaptionStyle = 'Clean' | 'Bold' | 'Cinematic' | 'Highlight' | 'Minimal';

export type CaptionPosition = 'bottom-center' | 'center' | 'top-center';

export type MusicMood =
  | 'Cinematic'
  | 'Emotional'
  | 'Suspense'
  | 'Motivational'
  | 'Calm'
  | 'Energetic';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  language: string;
  accent: string;
  tone: string;
  previewUrl?: string;
}

export interface VoiceConfig {
  voiceId: string;
  gender: 'Male' | 'Female';
  speed: number; // 0.5 - 2.0 (default 1.0)
  pitch: number; // 0.5 - 1.5 (default 1.0)
  volume: number; // 0.0 - 1.0 (default 1.0)
}

export interface VoiceInput {
  text: string;
  voiceConfig: VoiceConfig;
  language?: Language | string;
  gender?: 'Male' | 'Female';
  speed?: number;
  volume?: number;
}

export interface VoiceResult {
  audioUrl: string;
  duration: number;
  format: string;
  provider: string;
  isDemo?: boolean;
}

export interface Scene {
  id: string;
  projectId: string;
  sceneNumber: number;
  duration: number; // seconds
  narration: string;
  visualPrompt: string;
  visualUrl?: string;
  visualType?: 'image' | 'video';
  visualProvider?: string;
  audioUrl?: string;
  audioDuration?: number;
  voiceStatus?: 'pending' | 'generating' | 'completed' | 'failed';
  voiceError?: string;
  isDemoAudio?: boolean;
  voiceId?: string;
  voiceLanguage?: string;
  voiceSpeed?: number;
  caption: string;
  transition?: string;
  soundEffect?: string;
  status: 'pending' | 'ready' | 'generating' | 'failed';
}

export type ProjectStatus =
  | 'CREATING'
  | 'SCRIPTED'
  | 'SCENES_READY'
  | 'VOICE_GENERATING'
  | 'VOICE_READY'
  | 'draft'
  | 'scripted'
  | 'generating'
  | 'completed'
  | 'VIDEO_GENERATED'
  | 'failed';

export interface PlanGenerationRequest {
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
  voiceConfig?: VoiceConfig;
}

export interface ScriptPlan {
  title: string;
  hook: string;
  description: string;
  scenes: Array<{
    sceneNumber: number;
    duration: number;
    narration: string;
    visualPrompt: string;
    caption: string;
    transition?: string;
    soundEffect?: string;
  }>;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  topic: string;
  language: Language;
  videoType: VideoType;
  aspectRatio: AspectRatio;
  duration: string;
  customDurationSeconds?: number;
  contentStyle: ContentStyle;
  customContentStyle?: string;
  voiceConfig: VoiceConfig;
  visualStyle: VisualStyle;
  customVisualStyle?: string;
  captionsEnabled: boolean;
  captionStyle: CaptionStyle;
  captionPosition: CaptionPosition;
  backgroundMusicEnabled: boolean;
  musicMood: MusicMood;
  musicVolume: number; // 0.0 - 1.0
  hook?: string;
  description?: string;
  status: ProjectStatus;
  videoUrl?: string;
  renderedDuration?: number;
  thumbnailUrl?: string;
  seriesId?: string;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
  isDemo?: boolean;
}

export interface Series {
  id: string;
  name: string;
  description: string;
  niche: string;
  language: Language;
  videoStyle: ContentStyle;
  voice: VoiceConfig;
  visualStyle: VisualStyle;
  defaultDuration: DurationOption;
  postingFrequency: 'Daily' | '3x a week' | 'Weekly' | 'Bi-weekly';
  status: 'active' | 'paused';
  episodeCount: number;
  topicsHistory: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  scriptStyle: ContentStyle;
  visualStyle: VisualStyle;
  captionStyle: CaptionStyle;
  musicMood: MusicMood;
  defaultDuration: DurationOption;
  aspectRatio: AspectRatio;
  voiceGender: 'Male' | 'Female';
  tags: string[];
}

export type RenderStage =
  | 'idle'
  | 'preparing'
  | 'generating_scenes'
  | 'generating_voice'
  | 'rendering'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface RenderJob {
  id: string;
  projectId: string;
  status: RenderStage;
  progress: number; // 0 - 100
  message: string;
  outputUrl?: string;
  resolution: string;
  aspectRatio: AspectRatio;
  fps: number;
  createdAt: number;
  completedAt?: number;
  error?: string;
}

export interface ProviderStatus {
  name: string;
  configured: boolean;
  fallbackAvailable?: boolean;
  details?: string;
  geminiConfigured?: boolean;
  ttsConfigured?: boolean;
  imageConfigured?: boolean;
  videoConfigured?: boolean;
  storageConfigured?: boolean;
  demoMode?: boolean;
}

export interface AppSettings {
  defaultLanguage: Language;
  defaultAspectRatio: AspectRatio;
  defaultDuration: DurationOption;
  defaultCaptionStyle: CaptionStyle;
  preferredVoiceId: string;
  autoGenerateVisuals: boolean;
  autoGenerateVoice: boolean;
  renderResolution: '720p' | '1080p';
  renderFps: 30 | 60;
  offlineDemoMode: boolean;
  ttsEngine?: 'gemini' | 'custom' | 'demo';
  ttsProviderConfigured?: boolean;
}
