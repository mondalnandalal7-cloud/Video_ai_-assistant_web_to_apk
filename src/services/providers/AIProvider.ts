import {
  ScriptPlan,
  Project,
  Scene,
  Language,
  ContentStyle,
  VisualStyle,
  Series,
  VoiceConfig,
  PlanGenerationRequest,
} from '../../types';

export class AIProvider {
  /**
   * Generates a structured multi-scene video plan using Gemini AI
   */
  async generateScriptPlan(params: PlanGenerationRequest): Promise<{ plan: ScriptPlan; isDemo: boolean }> {
    let response: globalThis.Response;
    try {
      response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch (networkErr: any) {
      throw new Error(`Network error contacting video creation server: ${networkErr.message || 'Check your connection'}`);
    }

    let data: any = {};
    try {
      data = await response.json();
    } catch (parseErr: any) {
      throw new Error(`Invalid JSON response from server (${response.status}): ${parseErr.message}`);
    }

    if (!response.ok || !data.success || !data.plan) {
      const errorMsg = data.error || (response.status === 503
        ? 'Gemini is not configured. Configure Gemini API to generate real scripts.'
        : `Server returned HTTP ${response.status}`);
      throw new Error(errorMsg);
    }

    return {
      plan: data.plan,
      isDemo: !!data.isDemo,
    };
  }

  /**
   * Generates next episode topic for automated series
   */
  async generateNextSeriesTopic(series: Series | {
    name: string;
    niche: string;
    language: Language;
    videoStyle: ContentStyle;
    pastTopics?: string[];
    topicsHistory?: string[];
  }): Promise<{ topic: string; title: string; angle: string; isDemo: boolean }> {
    const pastTopics = (series as any).topicsHistory || (series as any).pastTopics || [];
    try {
      const response = await fetch('/api/generate-series-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesName: series.name,
          niche: series.niche,
          language: series.language,
          videoStyle: series.videoStyle,
          pastTopics,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          topic: data.topic,
          title: data.title,
          angle: data.angle,
          isDemo: !!data.isDemo,
        };
      }
    } catch {
      // Gracefully continue to procedural topic fallback
    }

    const fallbackTopic = `Unrevealed Secrets of ${series.niche || 'The Unknown'}: Part ${pastTopics.length + 1}`;
    return {
      topic: fallbackTopic,
      title: `${series.name}: ${fallbackTopic}`,
      angle: 'Shocking investigation of newly declassified evidence',
      isDemo: true,
    };
  }

  /**
   * Regenerates a single scene's narration, prompt, and caption with Gemini
   */
  async regenerateScene(scene: Scene, topic: string, style: string, language: Language = 'English'): Promise<Scene> {
    try {
      const response = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          visualStyle: style,
          language,
          currentScene: scene,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.scene) {
          return data.scene;
        }
      }
    } catch {
      // Fallback below
    }

    // Curated variation fallback if single scene AI call is offline
    const variations = [
      {
        narration: `Look closer at this detail that ordinary observers miss completely regarding ${topic}.`,
        visualPrompt: `Extreme macro cinematic detail shot of an eerie discovery related to ${topic}, dramatic rim lighting, 4k ultra high fidelity.`,
        caption: 'LOOK CLOSER',
        transition: 'fast glitch cut',
      },
      {
        narration: `When whistleblowers tried exposing this pattern, their files mysteriously vanished without a trace.`,
        visualPrompt: `Dimly lit underground archive room, scattered classified documents glowing with holographic data traces, ${style} aesthetic.`,
        caption: 'FILES VANISHED',
        transition: 'whip pan left',
      },
      {
        narration: `The real question isn't how this happened—it's who authorized it in the first place.`,
        visualPrompt: `Silhouette of a powerful figure in a glass skyscraper looking down at a neon-lit rain-soaked city below, atmospheric ${style}.`,
        caption: 'WHO AUTHORIZED THIS?',
        transition: 'slow zoom in',
      },
    ];

    const pick = variations[Math.floor(Math.random() * variations.length)];
    return {
      ...scene,
      narration: pick.narration,
      visualPrompt: pick.visualPrompt,
      caption: pick.caption,
      transition: pick.transition,
      status: 'ready',
    };
  }

  private createLocalFallbackPlan(params: PlanGenerationRequest): ScriptPlan {
    const { topic, contentStyle, visualStyle } = params;
    return {
      title: `${topic}: The Hidden Truth`,
      hook: `What you are about to discover about ${topic} will change everything you thought you knew.`,
      description: `Uncovering the deepest secrets and hidden truths about ${topic}.`,
      scenes: [
        {
          sceneNumber: 1,
          duration: 4,
          narration: `What you are about to discover about ${topic} will change everything you thought you knew.`,
          visualPrompt: `Dramatic wide shot of ${topic} shrouded in mysterious fog, neon accents, ${visualStyle} lighting.`,
          caption: 'PAY CLOSE ATTENTION',
          transition: 'fast zoom-in',
          soundEffect: 'dramatic bass drop',
        },
        {
          sceneNumber: 2,
          duration: 5,
          narration: `Historical logs recorded startling evidence that modern textbooks completely ignore.`,
          visualPrompt: `Close-up glowing artifact related to ${topic}, cinematic lighting, floating dust particles.`,
          caption: 'BURIED EVIDENCE',
          transition: 'whip pan',
          soundEffect: 'whoosh riser',
        },
        {
          sceneNumber: 3,
          duration: 5,
          narration: `Every single witness who investigated the site documented the identical anomaly.`,
          visualPrompt: `Silhouetted explorers observing an anomalous energy spike at ${topic}, volumetric god-rays.`,
          caption: 'IDENTICAL ANOMALIES',
          transition: 'flash cut',
          soundEffect: 'creepy glitch sound',
        },
        {
          sceneNumber: 4,
          duration: 6,
          narration: `And the most terrifying part? New satellite scans show it is beginning again right now.`,
          visualPrompt: `Futuristic radar telemetry scanning over ${topic}, glowing red danger markers, high-tech interface.`,
          caption: 'IT HAS STARTED AGAIN',
          transition: 'fast push-in',
          soundEffect: 'sonar beep',
        },
        {
          sceneNumber: 5,
          duration: 5,
          narration: `Is this random, or is something waking up? Leave your theory below and follow for Part 2.`,
          visualPrompt: `Epic twilight horizon overlooking ${topic}, dramatic clouds parting, cinematic depth.`,
          caption: 'WHAT DO YOU THINK?',
          transition: 'fade to black',
          soundEffect: 'deep cinema thud',
        },
      ],
    };
  }
}

export const aiProvider = new AIProvider();
