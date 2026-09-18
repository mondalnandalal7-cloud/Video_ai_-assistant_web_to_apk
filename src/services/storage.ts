import { Project, Scene, Series, Template, AppSettings, RenderJob } from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'aistudio_faceless_projects_v1',
  SCENES: 'aistudio_faceless_scenes_v1',
  SERIES: 'aistudio_faceless_series_v1',
  TEMPLATES: 'aistudio_faceless_templates_v1',
  SETTINGS: 'aistudio_faceless_settings_v1',
  RENDER_JOBS: 'aistudio_faceless_render_jobs_v1',
  HAS_SEEDED: 'aistudio_faceless_has_seeded_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultLanguage: 'English',
  defaultAspectRatio: '9:16',
  defaultDuration: '60 seconds',
  defaultCaptionStyle: 'Highlight',
  preferredVoiceId: 'male-deep-cinematic',
  autoGenerateVisuals: true,
  autoGenerateVoice: true,
  renderResolution: '1080p',
  renderFps: 30,
  offlineDemoMode: false,
};

export const BUILTIN_TEMPLATES: Template[] = [
  {
    id: 'tpl-mystery-short',
    name: 'Mystery Short',
    description: 'Suspenseful investigation structure with dramatic questions and ominous visual cues.',
    scriptStyle: 'Mystery',
    visualStyle: 'Dark',
    captionStyle: 'Highlight',
    musicMood: 'Suspense',
    defaultDuration: '60 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Male',
    tags: ['viral', 'suspense', 'unsolved', 'hook'],
  },
  {
    id: 'tpl-motivation-short',
    name: 'Motivation Short',
    description: 'High-energy mindset insights with bold captioning and uplifting build-ups.',
    scriptStyle: 'Motivational',
    visualStyle: 'Cinematic',
    captionStyle: 'Bold',
    musicMood: 'Motivational',
    defaultDuration: '30 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Male',
    tags: ['mindset', 'energy', 'success', 'reels'],
  },
  {
    id: 'tpl-facts-short',
    name: 'Facts Short',
    description: 'Rapid-fire verified trivia with clean contrast typography and bright imagery.',
    scriptStyle: 'Facts',
    visualStyle: 'Realistic',
    captionStyle: 'Clean',
    musicMood: 'Calm',
    defaultDuration: '60 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Female',
    tags: ['education', 'knowledge', 'didyouknow', 'fast'],
  },
  {
    id: 'tpl-history-short',
    name: 'History Short',
    description: 'Archival narrative tone exploring forgotten empires, battles, and legendary figures.',
    scriptStyle: 'History',
    visualStyle: 'Documentary',
    captionStyle: 'Cinematic',
    musicMood: 'Cinematic',
    defaultDuration: '90 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Male',
    tags: ['history', 'lore', 'empires', 'depth'],
  },
  {
    id: 'tpl-story-short',
    name: 'Story Short',
    description: 'Immersive character-driven micro-tales with emotional peaks and twists.',
    scriptStyle: 'Storytelling',
    visualStyle: 'AI Art',
    captionStyle: 'Highlight',
    musicMood: 'Emotional',
    defaultDuration: '60 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Female',
    tags: ['narrative', 'creative', 'drama', 'twist'],
  },
  {
    id: 'tpl-news-short',
    name: 'News Short',
    description: 'Fast-breaking informative breakdown with professional broadcasting tone.',
    scriptStyle: 'News-style',
    visualStyle: 'Realistic',
    captionStyle: 'Clean',
    musicMood: 'Energetic',
    defaultDuration: '30 seconds',
    aspectRatio: '9:16',
    voiceGender: 'Female',
    tags: ['breaking', 'tech', 'world', 'updates'],
  },
];

function generateSeedSvg(sceneNum: number, title: string, subtitle: string, accent: string = '#E5A93C', style: string = 'CINEMATIC'): string {
  const w = 720;
  const h = 1280;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
    <defs>
      <linearGradient id="bg_${sceneNum}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090B12" />
        <stop offset="50%" stop-color="#141B2D" />
        <stop offset="100%" stop-color="#05070B" />
      </linearGradient>
      <radialGradient id="glow_${sceneNum}" cx="50%" cy="38%" r="65%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.32" />
        <stop offset="60%" stop-color="${accent}" stop-opacity="0.04" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="vig_${sceneNum}" cx="50%" cy="50%" r="75%">
        <stop offset="35%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.85" />
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg_${sceneNum})" />
    <rect width="${w}" height="${h}" fill="url(#glow_${sceneNum})" />
    <path d="M ${w * 0.5} ${h * 0.65} L -100 ${h} M ${w * 0.5} ${h * 0.65} L ${w * 0.25} ${h} M ${w * 0.5} ${h * 0.65} L ${w * 0.75} ${h} M ${w * 0.5} ${h * 0.65} L ${w + 100} ${h}" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.25" />
    <rect width="${w}" height="${h}" fill="url(#vig_${sceneNum})" />
    <path d="M 36 68 L 36 36 L 68 36 M ${w - 36} 68 L ${w - 36} 36 L ${w - 68} 36 M 36 ${h - 68} L 36 ${h - 36} L 68 ${h - 36} M ${w - 36} ${h - 68} L ${w - 36} ${h - 36} L ${w - 68} ${h - 36}" stroke="${accent}" stroke-width="2.5" fill="none" stroke-opacity="0.65" />
    <circle cx="${w / 2}" cy="${h * 0.40}" r="68" fill="#000000" fill-opacity="0.55" stroke="${accent}" stroke-width="3" />
    <text x="${w / 2}" y="${h * 0.40 + 16}" fill="#ffffff" font-size="46" font-weight="900" font-family="system-ui, sans-serif" text-anchor="middle">0${sceneNum}</text>
    <rect x="40" y="${h - 96}" width="240" height="42" rx="8" fill="#000000" fill-opacity="0.8" stroke="${accent}" stroke-width="1.2" stroke-opacity="0.5" />
    <text x="56" y="${h - 69}" fill="${accent}" font-size="13" font-weight="bold" font-family="system-ui, sans-serif">SCENE 0${sceneNum} // ${style}</text>
    <text x="${w / 2}" y="${h * 0.54}" fill="#ffffff" font-size="24" font-weight="bold" font-family="system-ui, sans-serif" text-anchor="middle">${title}</text>
    <text x="${w / 2}" y="${h * 0.58}" fill="#94a3b8" font-size="16" font-family="system-ui, sans-serif" text-anchor="middle">${subtitle}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export class StorageService {
  constructor() {
    this.initSeedData();
  }

  private initSeedData(): void {
    if (typeof window === 'undefined') return;

    const hasSeeded = localStorage.getItem(STORAGE_KEYS.HAS_SEEDED);
    if (!hasSeeded) {
      // Seed default series
      const seedSeries: Series[] = [
        {
          id: 'series-dark-mystery-india',
          name: 'Dark Mystery India',
          description: 'Weekly automated deep dives into India’s most enigmatic folklore, lost temples, and supernatural tales.',
          niche: 'Ancient Mysteries & Paranormal',
          language: 'Hindi',
          videoStyle: 'Mystery',
          voice: {
            voiceId: 'male-hindi-kabir',
            gender: 'Male',
            speed: 1.0,
            pitch: 0.95,
            volume: 1.0,
          },
          visualStyle: 'Dark',
          defaultDuration: '60 seconds',
          postingFrequency: '3x a week',
          status: 'active',
          episodeCount: 4,
          topicsHistory: [
            'Bhangarh Fort: The Midnight Curse',
            'The Lonar Crater Magnetic Anomaly',
            'Kuldhara: The Village Abandoned in One Night',
            'Roopkund Skeleton Lake Mysteries',
          ],
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
          updatedAt: Date.now(),
        },
        {
          id: 'series-cosmic-horizons',
          name: 'Cosmic Horizons',
          description: 'Mind-bending astrophysics and deep space anomalies formatted for vertical viral reels.',
          niche: 'Space & Astronomy',
          language: 'English',
          videoStyle: 'Documentary',
          voice: {
            voiceId: 'male-deep-cinematic',
            gender: 'Male',
            speed: 1.05,
            pitch: 1.0,
            volume: 1.0,
          },
          visualStyle: 'Cinematic',
          defaultDuration: '60 seconds',
          postingFrequency: 'Daily',
          status: 'active',
          episodeCount: 8,
          topicsHistory: [
            'What If The James Webb Telescope Detected A Megastructure?',
            'The Rogue Planet Wandering Towards Our Solar System',
            'The Wow Signal Decoded: What Did We Miss?',
          ],
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 14,
          updatedAt: Date.now(),
        },
      ];

      // Seed initial sample projects
      const seedProjects: Project[] = [
        {
          id: 'proj-bhangarh',
          userId: 'user-default',
          title: '5 Mysterious Places In India',
          topic: '5 mysterious places in India',
          language: 'English',
          videoType: 'YouTube Short',
          aspectRatio: '9:16',
          duration: '60 seconds',
          contentStyle: 'Mystery',
          voiceConfig: {
            voiceId: 'male-deep-cinematic',
            gender: 'Male',
            speed: 1.0,
            pitch: 1.0,
            volume: 1.0,
          },
          visualStyle: 'Cinematic',
          captionsEnabled: true,
          captionStyle: 'Highlight',
          captionPosition: 'bottom-center',
          backgroundMusicEnabled: true,
          musicMood: 'Suspense',
          musicVolume: 0.45,
          hook: 'These 5 places in India are so terrifying that entry after sunset is strictly forbidden by law.',
          description: 'Exploring the 5 most unexplainable and haunted locations across India. #india #mystery #shorts',
          status: 'completed',
          renderedDuration: 28,
          videoUrl: '',
          createdAt: Date.now() - 1000 * 60 * 60 * 3,
          updatedAt: Date.now() - 1000 * 60 * 30,
          isDemo: true,
        },
        {
          id: 'proj-black-hole',
          userId: 'user-default',
          title: 'What Happens Inside A Black Hole?',
          topic: 'What happens when you cross the event horizon of a supermassive black hole?',
          language: 'English',
          videoType: 'YouTube Short',
          aspectRatio: '9:16',
          duration: '30 seconds',
          contentStyle: 'Documentary',
          voiceConfig: {
            voiceId: 'female-mysterious',
            gender: 'Female',
            speed: 1.1,
            pitch: 1.0,
            volume: 1.0,
          },
          visualStyle: 'Dark',
          captionsEnabled: true,
          captionStyle: 'Bold',
          captionPosition: 'bottom-center',
          backgroundMusicEnabled: true,
          musicMood: 'Cinematic',
          musicVolume: 0.5,
          hook: 'If you fell into a black hole, you would see the entire future of the universe unfold in a fraction of a second.',
          description: 'The terrifying physics of spaghettification and time dilation explained in 30 seconds.',
          status: 'draft',
          createdAt: Date.now() - 1000 * 60 * 60 * 12,
          updatedAt: Date.now() - 1000 * 60 * 60 * 10,
          isDemo: true,
        },
      ];

      // Seed initial scenes for first project
      const seedScenes: Scene[] = [
        {
          id: 'sc-1',
          projectId: 'proj-bhangarh',
          sceneNumber: 1,
          duration: 4,
          narration: 'These 5 places in India are so terrifying that entry after sunset is strictly forbidden by law.',
          visualPrompt: 'Ancient crumbling stone fortress gate wrapped in night fog with glowing warning sign, cinematic dark lighting',
          visualUrl: generateSeedSvg(1, 'ENTRY FORBIDDEN AFTER SUNSET', 'Ancient crumbling stone fortress gate', '#E5A93C', 'CINEMATIC'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'STRICTLY FORBIDDEN BY LAW',
          transition: 'fast zoom-in',
          soundEffect: 'deep cinema thud',
          status: 'ready',
        },
        {
          id: 'sc-2',
          projectId: 'proj-bhangarh',
          sceneNumber: 2,
          duration: 6,
          narration: 'First is Bhangarh Fort in Rajasthan. Legend speaks of a dark sorcerer who cursed every living soul inside the palace walls.',
          visualPrompt: 'Drone shot flying over ruins of Bhangarh Fort at sunset, long shadows stretching over dead stone corridors',
          visualUrl: generateSeedSvg(2, 'BHANGARH FORT CURSE', 'Ruins under bloody twilight shadows', '#E5A93C', 'CINEMATIC'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'BHANGARH FORT CURSE',
          transition: 'whip pan',
          soundEffect: 'whoosh riser',
          status: 'ready',
        },
        {
          id: 'sc-3',
          projectId: 'proj-bhangarh',
          sceneNumber: 3,
          duration: 6,
          narration: 'Next is Kuldhara, an entire village where over 1,500 people vanished overnight in 1825, leaving no trace behind.',
          visualPrompt: 'Abandoned sandstone village homes under a blood-red desert twilight, wind blowing dust through empty doors',
          visualUrl: generateSeedSvg(3, '1,500 VANISHED OVERNIGHT', 'Kuldhara village ghost streets in the desert', '#E5A93C', 'CINEMATIC'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: '1500 VANISHED OVERNIGHT',
          transition: 'flash cut',
          soundEffect: 'whisper wind',
          status: 'ready',
        },
        {
          id: 'sc-4',
          projectId: 'proj-bhangarh',
          sceneNumber: 4,
          duration: 6,
          narration: 'Then there is Roopkund, a frozen Himalayan lake high at 16,000 feet, filled with hundreds of ancient human skeletons.',
          visualPrompt: 'Glacial Himalayan lake with skulls visible beneath cracked crystal ice, ominous mountain peaks in background',
          visualUrl: generateSeedSvg(4, 'LAKE OF SKELETONS', 'Roopkund frozen lake high in the Himalayas', '#E5A93C', 'CINEMATIC'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'LAKE OF SKELETONS',
          transition: 'slow zoom-in',
          soundEffect: 'ice cracking',
          status: 'ready',
        },
        {
          id: 'sc-5',
          projectId: 'proj-bhangarh',
          sceneNumber: 5,
          duration: 6,
          narration: 'Which of these places would you dare visit? Leave a comment and subscribe for Part 2.',
          visualPrompt: 'Silhouette of a lone adventurer standing on a cliff edge overlooking ancient Indian temples in the mist',
          visualUrl: generateSeedSvg(5, 'WOULD YOU DARE VISIT?', 'Cliff edge silhouette at midnight mist', '#E5A93C', 'CINEMATIC'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'WOULD YOU DARE VISIT?',
          transition: 'fade to black',
          soundEffect: 'heartbeat drop',
          status: 'ready',
        },
        // Seed scenes for project 2: Black Hole
        {
          id: 'sc-bh-1',
          projectId: 'proj-black-hole',
          sceneNumber: 1,
          duration: 6,
          narration: 'If you fell into a black hole, you would see the entire future of the universe unfold in a fraction of a second.',
          visualPrompt: 'Accretion disk swirling around a supermassive black hole with gravitational lensing warping spacetime',
          visualUrl: generateSeedSvg(1, 'CROSSING EVENT HORIZON', 'Gravitational lensing warping spacetime', '#6366F1', 'DARK'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'CROSSING EVENT HORIZON',
          transition: 'fast zoom-in',
          soundEffect: 'deep cinema thud',
          status: 'ready',
        },
        {
          id: 'sc-bh-2',
          projectId: 'proj-black-hole',
          sceneNumber: 2,
          duration: 8,
          narration: 'Past the event horizon, space itself cascades inward faster than light. Escaping is not just difficult—it is mathematically impossible.',
          visualPrompt: 'Point of no return where light beams bend into eternal darkness inside the Schwarzschild radius',
          visualUrl: generateSeedSvg(2, 'FASTER THAN LIGHT', 'Spacetime cascades beyond the speed of light', '#6366F1', 'DARK'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'FASTER THAN LIGHT',
          transition: 'whip pan',
          soundEffect: 'whoosh riser',
          status: 'ready',
        },
        {
          id: 'sc-bh-3',
          projectId: 'proj-black-hole',
          sceneNumber: 3,
          duration: 8,
          narration: 'Gravitational tidal forces would stretch every atom of your body into an ultra-thin strand—a terrifying cosmological event called spaghettification.',
          visualPrompt: 'Matter stretched into glowing relativistic plasma threads plunging into the singularity',
          visualUrl: generateSeedSvg(3, 'SPAGHETTIFICATION', 'Tidal forces stretch atoms into quantum threads', '#6366F1', 'DARK'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'SPAGHETTIFICATION',
          transition: 'flash cut',
          soundEffect: 'distortion riser',
          status: 'ready',
        },
        {
          id: 'sc-bh-4',
          projectId: 'proj-black-hole',
          sceneNumber: 4,
          duration: 8,
          narration: 'At the central singularity, our known laws of physics shatter completely into zero volume and infinite density.',
          visualPrompt: 'Infinitesimal zero-point center of absolute singularity where time ceases to exist',
          visualUrl: generateSeedSvg(4, 'INFINITE DENSITY', 'Zero volume and infinite density at singularity', '#6366F1', 'DARK'),
          visualType: 'image',
          visualProvider: 'procedural_generator',
          caption: 'INFINITE DENSITY',
          transition: 'fade to black',
          soundEffect: 'heartbeat drop',
          status: 'ready',
        },
      ];

      localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(seedSeries));
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(seedProjects));
      localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(seedScenes));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      localStorage.setItem(STORAGE_KEYS.HAS_SEEDED, 'true');
    } else {
      // Ensure existing localStorage state has valid visualUrls for seed scenes and black hole scenes
      try {
        const storedScenesRaw = localStorage.getItem(STORAGE_KEYS.SCENES);
        let existingScenes: Scene[] = storedScenesRaw ? JSON.parse(storedScenesRaw) : [];
        let updated = false;

        existingScenes = existingScenes.map((sc) => {
          if (!sc.visualUrl) {
            updated = true;
            return {
              ...sc,
              visualUrl: generateSeedSvg(sc.sceneNumber, sc.caption || 'SCENE', 'Faceless Video Demo Visual', '#E5A93C', 'CINEMATIC'),
              visualType: 'image' as const,
              visualProvider: 'procedural_generator' as const,
            };
          }
          return sc;
        });

        const hasBlackHole = existingScenes.some((s) => s.projectId === 'proj-black-hole');
        if (!hasBlackHole) {
          const bhScenes: Scene[] = [
            {
              id: 'sc-bh-1',
              projectId: 'proj-black-hole',
              sceneNumber: 1,
              duration: 6,
              narration: 'If you fell into a black hole, you would see the entire future of the universe unfold in a fraction of a second.',
              visualPrompt: 'Accretion disk swirling around a supermassive black hole with gravitational lensing warping spacetime',
              visualUrl: generateSeedSvg(1, 'CROSSING EVENT HORIZON', 'Gravitational lensing warping spacetime', '#6366F1', 'DARK'),
              visualType: 'image',
              visualProvider: 'procedural_generator',
              caption: 'CROSSING EVENT HORIZON',
              transition: 'fast zoom-in',
              soundEffect: 'deep cinema thud',
              status: 'ready',
            },
            {
              id: 'sc-bh-2',
              projectId: 'proj-black-hole',
              sceneNumber: 2,
              duration: 8,
              narration: 'Past the event horizon, space itself cascades inward faster than light. Escaping is not just difficult—it is mathematically impossible.',
              visualPrompt: 'Point of no return where light beams bend into eternal darkness inside the Schwarzschild radius',
              visualUrl: generateSeedSvg(2, 'FASTER THAN LIGHT', 'Spacetime cascades beyond the speed of light', '#6366F1', 'DARK'),
              visualType: 'image',
              visualProvider: 'procedural_generator',
              caption: 'FASTER THAN LIGHT',
              transition: 'whip pan',
              soundEffect: 'whoosh riser',
              status: 'ready',
            },
            {
              id: 'sc-bh-3',
              projectId: 'proj-black-hole',
              sceneNumber: 3,
              duration: 8,
              narration: 'Gravitational tidal forces would stretch every atom of your body into an ultra-thin strand—a terrifying cosmological event called spaghettification.',
              visualPrompt: 'Matter stretched into glowing relativistic plasma threads plunging into the singularity',
              visualUrl: generateSeedSvg(3, 'SPAGHETTIFICATION', 'Tidal forces stretch atoms into quantum threads', '#6366F1', 'DARK'),
              visualType: 'image',
              visualProvider: 'procedural_generator',
              caption: 'SPAGHETTIFICATION',
              transition: 'flash cut',
              soundEffect: 'distortion riser',
              status: 'ready',
            },
            {
              id: 'sc-bh-4',
              projectId: 'proj-black-hole',
              sceneNumber: 4,
              duration: 8,
              narration: 'At the central singularity, our known laws of physics shatter completely into zero volume and infinite density.',
              visualPrompt: 'Infinitesimal zero-point center of absolute singularity where time ceases to exist',
              visualUrl: generateSeedSvg(4, 'INFINITE DENSITY', 'Zero volume and infinite density at singularity', '#6366F1', 'DARK'),
              visualType: 'image',
              visualProvider: 'procedural_generator',
              caption: 'INFINITE DENSITY',
              transition: 'fade to black',
              soundEffect: 'heartbeat drop',
              status: 'ready',
            },
          ];
          existingScenes = [...existingScenes, ...bhScenes];
          updated = true;
        }

        if (updated) {
          localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(existingScenes));
        }
      } catch {
        // Fallback safely
      }
    }
  }

  // --- PROJECTS ---
  getProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  saveProject(project: Project): void {
    const list = this.getProjects();
    const idx = list.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      list[idx] = { ...project, updatedAt: Date.now() };
    } else {
      list.unshift({ ...project, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));
  }

  deleteProject(id: string): void {
    const list = this.getProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(list));

    // Also remove scenes
    const allScenes = this.getAllScenes().filter((s) => s.projectId !== id);
    localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(allScenes));
  }

  // --- SCENES ---
  getAllScenes(): Scene[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SCENES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getProjectScenes(projectId: string): Scene[] {
    return this.getAllScenes()
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => a.sceneNumber - b.sceneNumber);
  }

  saveProjectScenes(projectId: string, scenes: Scene[]): void {
    const otherScenes = this.getAllScenes().filter((s) => s.projectId !== projectId);
    const updated = [...otherScenes, ...scenes];
    localStorage.setItem(STORAGE_KEYS.SCENES, JSON.stringify(updated));
  }

  // --- SERIES ---
  getSeries(): Series[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERIES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  getSeriesById(id: string): Series | undefined {
    return this.getSeries().find((s) => s.id === id);
  }

  saveSeries(series: Series): void {
    const list = this.getSeries();
    const idx = list.findIndex((s) => s.id === series.id);
    if (idx >= 0) {
      list[idx] = { ...series, updatedAt: Date.now() };
    } else {
      list.unshift({ ...series, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(list));
  }

  deleteSeries(id: string): void {
    const list = this.getSeries().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(list));
  }

  // --- TEMPLATES ---
  getTemplates(): Template[] {
    return BUILTIN_TEMPLATES;
  }

  getTemplateById(id: string): Template | undefined {
    return BUILTIN_TEMPLATES.find((t) => t.id === id);
  }

  // --- SETTINGS ---
  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  }
}

export const storageService = new StorageService();
