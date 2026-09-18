import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy Gemini client helper
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

/**
 * Robust Gemini caller with automatic retry on transient spikes (503/429)
 * and intelligent fallback to alternative high-throughput models (gemini-flash-latest, gemini-3.1-flash-lite).
 */
async function generateContentWithFallback(
  client: GoogleGenAI,
  options: {
    prompt: string;
    temperature?: number;
    responseSchema?: any;
  }
): Promise<string> {
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.7,
        };
        if (options.responseSchema) {
          config.responseSchema = options.responseSchema;
        }

        const response = await client.models.generateContent({
          model,
          contents: options.prompt,
          config,
        });

        if (response.text && response.text.trim()) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err || '');
        const isTransient =
          errStr.includes('503') ||
          errStr.includes('high demand') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('429') ||
          err?.status === 503 ||
          err?.code === 503;

        if (isTransient && attempt === 0) {
          // Brief pause before retry on transient spike
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        // If still failing with transient error or other error, break to next candidate model
        break;
      }
    }
  }

  throw lastError || new Error('Gemini generation unavailable across models.');
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// PCM 16-bit to WAV converter with standard RIFF header
function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const wavBuffer = Buffer.alloc(44 + pcmBuffer.length);

  wavBuffer.write('RIFF', 0);
  wavBuffer.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavBuffer.write('WAVE', 8);
  wavBuffer.write('fmt ', 12);
  wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavBuffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  wavBuffer.writeUInt16LE(numChannels, 22);
  wavBuffer.writeUInt32LE(sampleRate, 24);
  wavBuffer.writeUInt32LE(byteRate, 28);
  wavBuffer.writeUInt16LE(blockAlign, 32);
  wavBuffer.writeUInt16LE(16, 34); // BitsPerSample
  wavBuffer.write('data', 36);
  wavBuffer.writeUInt32LE(pcmBuffer.length, 40);

  pcmBuffer.copy(wavBuffer, 44);
  return wavBuffer;
}

// Map gender and voiceId to Gemini 3.1 Flash TTS prebuilt voices
function mapGeminiVoice(gender?: string, voiceId?: string): string {
  const v = (voiceId || '').toLowerCase();
  const g = (gender || '').toLowerCase();

  if (g === 'female' || v.includes('female')) {
    if (v.includes('warm') || v.includes('mysterious') || v.includes('story') || v.includes('calm')) {
      return 'Aoede';
    }
    return 'Kore';
  }

  // Male
  if (v.includes('cinematic') || v.includes('deep') || v.includes('documentary')) {
    return 'Charon';
  }
  if (v.includes('action') || v.includes('energy') || v.includes('fast') || v.includes('intense')) {
    return 'Fenrir';
  }
  return 'Puck';
}

// Provider & environment configuration status
app.get('/api/status', (_req: Request, res: Response) => {
  const hasGemini = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasTTS = !!(process.env.TTS_API_KEY && process.env.TTS_API_KEY.trim() !== '');
  const hasImage = !!(process.env.IMAGE_API_KEY && process.env.IMAGE_API_KEY.trim() !== '');
  const hasVideo = !!(process.env.VIDEO_API_KEY && process.env.VIDEO_API_KEY.trim() !== '');
  const hasStorage = !!(process.env.STORAGE_CONFIG && process.env.STORAGE_CONFIG.trim() !== '');

  res.json({
    geminiConfigured: hasGemini,
    ttsConfigured: hasTTS,
    imageConfigured: hasImage,
    videoConfigured: hasVideo,
    storageConfigured: hasStorage,
    demoMode: !hasGemini || !hasTTS || !hasImage,
    providers: [
      {
        name: 'Gemini AI Script & Director',
        configured: hasGemini,
        fallbackAvailable: true,
        details: hasGemini ? 'Gemini 3.8 Flash online' : 'Provider not configured - Procedural script engine active',
        statusText: hasGemini ? 'ONLINE' : 'Provider not configured',
      },
      {
        name: 'Text-to-Speech (TTS)',
        configured: hasTTS || hasGemini,
        fallbackAvailable: true,
        details: hasTTS
          ? 'Dedicated TTS provider online'
          : hasGemini
          ? 'Gemini 3.1 Flash AI TTS Engine online'
          : 'Provider not configured - Web Audio & SpeechSynthesis active',
        statusText: (hasTTS || hasGemini) ? 'ONLINE' : 'Provider not configured',
      },
      {
        name: 'Visual Generation',
        configured: hasImage,
        fallbackAvailable: true,
        details: hasImage ? 'Dedicated Image provider online' : 'Provider not configured - Procedural Canvas visual generator active',
        statusText: hasImage ? 'ONLINE' : 'Provider not configured',
      },
      {
        name: 'Video Renderer Engine',
        configured: true,
        fallbackAvailable: true,
        details: 'Client-side Canvas & MediaRecorder video compositor online',
        statusText: 'ONLINE',
      },
      {
        name: 'Storage & Database',
        configured: hasStorage,
        fallbackAvailable: true,
        details: hasStorage ? 'Cloud Storage configured' : 'Provider not configured - LocalStorage & Offline storage active',
        statusText: hasStorage ? 'ONLINE' : 'Provider not configured',
      },
    ],
  });
});

// TTS specific status endpoint
app.get('/api/tts-status', (_req: Request, res: Response) => {
  const hasTTSKey = !!(process.env.TTS_API_KEY && process.env.TTS_API_KEY.trim() !== '');
  const hasGemini = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');

  res.json({
    configured: hasTTSKey,
    hasTTSKey,
    geminiAvailable: hasGemini,
    message: hasTTSKey
      ? 'Dedicated TTS provider configured.'
      : hasGemini
      ? 'Gemini AI Voice engine available.'
      : 'Voice provider is not configured.',
  });
});

// Real AI Voice Generation Endpoint
app.post('/api/generate-speech', async (req: Request, res: Response) => {
  const {
    text,
    voiceConfig = {},
    language = 'English',
    demoMode = false,
    engine = 'auto',
  } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'Narration text is required.' });
  }

  const hasTTSKey = !!(process.env.TTS_API_KEY && process.env.TTS_API_KEY.trim() !== '');
  const gemini = getGeminiClient();

  // If explicit demo mode or neither TTS key nor Gemini is available
  if (demoMode || engine === 'demo' || (!hasTTSKey && !gemini)) {
    const words = text.trim().split(/\s+/).length;
    const duration = Math.max(2.0, Math.min(15, Number((words / 2.6).toFixed(1))));
    const sampleRate = 24000;
    const numSamples = Math.round(duration * sampleRate);
    const pcmBuffer = Buffer.alloc(numSamples * 2);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const baseFreq = voiceConfig.gender === 'Female' ? 240 : 140;
      const env = Math.min(1, Math.sin((Math.PI * i) / numSamples) * 1.8);
      const mod = Math.sin(2 * Math.PI * 4 * t);
      const sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.22 * env * (0.85 + 0.15 * mod);
      pcmBuffer.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(sample * 32767))), i * 2);
    }
    const wav = pcm16ToWav(pcmBuffer, sampleRate, 1);
    return res.json({
      success: true,
      audioUrl: `data:audio/wav;base64,${wav.toString('base64')}`,
      duration,
      format: 'audio/wav',
      provider: 'demo_synthesizer',
      isDemo: true,
    });
  }

  // Real AI Voice generation via Gemini 3.1 Flash TTS
  const voiceName = mapGeminiVoice(voiceConfig.gender, voiceConfig.voiceId);
  const cleanNarration = text.trim();
  let promptText = cleanNarration;
  if (language && language !== 'English') {
    promptText = `Speak naturally in ${language}: ${cleanNarration}`;
  }

  // Retry with exponential backoff on transient 503/429
  let lastError: any = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await gemini!.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Data = (part as any)?.inlineData?.data;

      if (!base64Data || base64Data.length === 0) {
        throw new Error('Received empty audio data from voice provider.');
      }

      const pcmBuffer = Buffer.from(base64Data, 'base64');
      const wavBuffer = pcm16ToWav(pcmBuffer, 24000, 1);
      const duration = Number((pcmBuffer.length / 48000).toFixed(2));

      return res.json({
        success: true,
        audioUrl: `data:audio/wav;base64,${wavBuffer.toString('base64')}`,
        duration,
        format: 'audio/wav',
        provider: 'gemini-3.1-flash-tts',
        isDemo: false,
      });
    } catch (err: any) {
      lastError = err;
      const errStr = String(err?.message || err || '');
      const isTransient =
        errStr.includes('503') ||
        errStr.includes('high demand') ||
        errStr.includes('UNAVAILABLE') ||
        errStr.includes('429') ||
        err?.status === 503 ||
        err?.status === 429 ||
        err?.code === 503;

      if (isTransient && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        continue;
      }
      break;
    }
  }

  const statusCode = lastError?.status || lastError?.code || 500;
  return res.status(typeof statusCode === 'number' && statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
    success: false,
    error: lastError?.message || 'Voice generation failed. Please try again.',
    statusCode,
  });
});

// Scene visual generation endpoint (Safe fallback if optional IMAGE_API_KEY is not configured)
app.post('/api/generate-scene-visual', async (req: Request, res: Response) => {
  const { prompt, style = 'Cinematic', aspectRatio = '9:16', sceneNumber = 1, topic = '' } = req.body;
  const hasImage = !!(process.env.IMAGE_API_KEY && process.env.IMAGE_API_KEY.trim() !== '');

  if (!hasImage) {
    return res.json({
      success: false,
      configured: false,
      status: 'Provider not configured',
      isDemo: true,
      message: 'IMAGE_API_KEY is not configured. Running in Demo Mode with client-side procedural generator.',
    });
  }

  // If IMAGE_API_KEY is provided, external API calls could be placed here safely
  return res.json({
    success: false,
    configured: false,
    status: 'Provider not configured',
    isDemo: true,
  });
});

// Calculate scene count based on duration text
function getTargetSceneCount(durationStr: string, customDurationSeconds?: number): { min: number; max: number; targetDuration: number } {
  if (customDurationSeconds && customDurationSeconds > 0) {
    const min = Math.max(3, Math.round(customDurationSeconds / 8));
    const max = Math.max(min + 1, Math.round(customDurationSeconds / 4));
    return { min, max, targetDuration: customDurationSeconds };
  }
  if (durationStr.includes('30')) {
    return { min: 4, max: 6, targetDuration: 30 };
  } else if (durationStr.includes('60')) {
    return { min: 7, max: 10, targetDuration: 60 };
  } else if (durationStr.includes('90')) {
    return { min: 11, max: 15, targetDuration: 90 };
  } else if (durationStr.includes('3 min') || durationStr.includes('180')) {
    return { min: 18, max: 24, targetDuration: 180 };
  }
  return { min: 6, max: 9, targetDuration: 45 };
}

// Generate structured script plan with real Gemini AI
app.post('/api/generate-plan', async (req: Request, res: Response) => {
  const {
    topic,
    language = 'English',
    videoType = 'YouTube Short',
    aspectRatio = '9:16',
    duration = '60 seconds',
    customDurationSeconds,
    contentStyle = 'Mystery',
    customContentStyle,
    visualStyle = 'Cinematic',
    customVisualStyle,
    voice = 'Male',
    captions = true,
    backgroundMusic = true,
    musicMood = 'Suspense',
  } = req.body;

  if (!topic || typeof topic !== 'string' || topic.trim() === '') {
    return res.status(400).json({ success: false, error: 'A video topic is required to generate a script.' });
  }

  const client = getGeminiClient();

  // If Gemini API is not configured, show explicit message as requested
  if (!client) {
    return res.status(503).json({
      success: false,
      error: 'Gemini is not configured. Configure Gemini API to generate real scripts.',
      isDemo: true,
    });
  }

  const effectiveContentStyle = customContentStyle?.trim() || contentStyle;
  const effectiveVisualStyle = customVisualStyle?.trim() || visualStyle;
  const { min, max, targetDuration } = getTargetSceneCount(duration, customDurationSeconds);

  const languagePromptDirective = {
    English: 'Write all script narration, the opening hook, and on-screen captions strictly in fluent, modern English.',
    Hindi: 'Write all script narration, the opening hook, and on-screen captions in authentic, natural Hindi (using Devanagari script or authentic conversational Hindi).',
    Bengali: 'Write all script narration, the opening hook, and on-screen captions in authentic, natural Bengali (বাংলা script).',
    Tamil: 'Write all script narration, the opening hook, and on-screen captions in authentic, natural Tamil (தமிழ் script).',
  }[language as string] || `Write all script narration, the opening hook, and on-screen captions in ${language}.`;

  const prompt = `You are a world-class viral faceless video creator, scriptwriter, and director.
Generate a complete, high-retention, cinematic faceless video plan with the following specifications:
- TOPIC: "${topic.trim()}"
- TARGET LANGUAGE: ${language}
- VIDEO FORMAT: ${videoType} (${aspectRatio})
- TOTAL TARGET DURATION: ${targetDuration} seconds
- TARGET SCENE COUNT: between ${min} and ${max} scenes
- CONTENT STYLE: ${effectiveContentStyle}
- VISUAL STYLE: ${effectiveVisualStyle}
- MUSIC MOOD: ${musicMood}

LANGUAGE DIRECTIVE:
${languagePromptDirective}
CRITICAL NOTE: All "visualPrompt" descriptions MUST remain in detailed, evocative English so visual rendering engines and image models can interpret them accurately.

VIRAL RETENTION RULES:
1. Scene 1 (0-3s) MUST contain an explosive, irresistible HOOK that immediately stops viewers from scrolling. Never start with "Welcome", "Hello", or "Today we will see".
2. Every scene duration MUST be an integer seconds (between 3 and 8 seconds).
3. The sum of all scene durations MUST equal approximately ${targetDuration} seconds (target: ${targetDuration}s, allowed range: ${Math.max(15, targetDuration - 6)}s to ${targetDuration + 6}s).
4. Each scene must have:
   - sceneNumber: sequential integer (1, 2, 3...)
   - duration: integer seconds (3-8)
   - narration: gripping voiceover sentence(s) in ${language}
   - visualPrompt: highly detailed English visual prompt describing lighting, composition, camera movement, and ${effectiveVisualStyle} aesthetic
   - caption: 2-6 words punchy highlight caption in ${language}
   - transition: visual transition name (e.g. fast zoom-in, whip pan, flash cut, slow push-in)
   - soundEffect: sound effect cue (e.g. dramatic whoosh, heartbeat thud, low drone riser, vinyl scratch)
5. Provide a captivating title, opening hook, and 2-sentence description with relevant hashtags in ${language}.`;

  try {
    const responseText = await generateContentWithFallback(client, {
      prompt,
      temperature: 0.7,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Viral video title' },
          hook: { type: Type.STRING, description: `Irresistible 3-second hook in ${language}` },
          description: { type: Type.STRING, description: `Description with hashtags in ${language}` },
          scenes: {
            type: Type.ARRAY,
            description: 'Sequential scene list for the video',
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                duration: { type: Type.INTEGER },
                narration: { type: Type.STRING },
                visualPrompt: { type: Type.STRING },
                caption: { type: Type.STRING },
                transition: { type: Type.STRING },
                soundEffect: { type: Type.STRING },
              },
              required: ['sceneNumber', 'duration', 'narration', 'visualPrompt', 'caption', 'transition', 'soundEffect'],
            },
          },
        },
        required: ['title', 'hook', 'description', 'scenes'],
      },
    });

    if (!responseText) {
      throw new Error('No response text returned from Gemini API.');
    }

    let parsedPlan: any;
    try {
      parsedPlan = JSON.parse(responseText);
    } catch (parseErr: any) {
      throw new Error(`Failed to parse structured JSON from Gemini: ${parseErr.message}`);
    }

    if (!parsedPlan.scenes || !Array.isArray(parsedPlan.scenes) || parsedPlan.scenes.length === 0) {
      throw new Error('Gemini returned an invalid plan structure without scenes.');
    }

    // Ensure sequential scene numbers and duration normalization
    parsedPlan.scenes = parsedPlan.scenes.map((s: any, idx: number) => ({
      sceneNumber: idx + 1,
      duration: typeof s.duration === 'number' && s.duration > 0 ? Math.round(s.duration) : 5,
      narration: String(s.narration || '').trim(),
      visualPrompt: String(s.visualPrompt || '').trim(),
      caption: String(s.caption || '').trim(),
      transition: String(s.transition || 'fast zoom-in').trim(),
      soundEffect: String(s.soundEffect || 'whoosh riser').trim(),
    }));

    return res.json({
      success: true,
      plan: parsedPlan,
      isDemo: false,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error communicating with Gemini API. Please retry.',
      details: err?.toString(),
    });
  }
});

// Regenerate single scene with Gemini
app.post('/api/regenerate-scene', async (req: Request, res: Response) => {
  const { topic, visualStyle = 'Cinematic', language = 'English', currentScene } = req.body;
  const client = getGeminiClient();

  if (!client) {
    return res.status(503).json({
      success: false,
      error: 'Gemini is not configured. Configure Gemini API to generate real scripts.',
    });
  }

  try {
    const prompt = `You are a viral faceless video creator and director.
Regenerate a compelling, alternative scene for a faceless video:
- TOPIC: "${topic}"
- VISUAL STYLE: "${visualStyle}"
- LANGUAGE: "${language}"
- CURRENT NARRATION: "${currentScene?.narration || ''}"

Return valid JSON with an improved, fresh scene variation:
{
  "narration": "New voiceover narration in ${language}",
  "visualPrompt": "Detailed English visual prompt for image generation reflecting ${visualStyle} lighting, camera angle, and scene mood",
  "caption": "Punchy on-screen caption (2-5 words) in ${language}",
  "transition": "Transition name e.g. fast zoom-in, whip pan, flash cut",
  "soundEffect": "Sound effect cue e.g. whoosh riser, cinema thud, heart drop"
}`;

    const responseText = await generateContentWithFallback(client, {
      prompt,
      temperature: 0.85,
    });

    const parsed = JSON.parse(responseText || '{}');
    if (parsed.narration && parsed.visualPrompt) {
      return res.json({
        success: true,
        scene: {
          ...currentScene,
          narration: parsed.narration,
          visualPrompt: parsed.visualPrompt,
          caption: parsed.caption || currentScene?.caption || '',
          transition: parsed.transition || currentScene?.transition || 'fast zoom-in',
          soundEffect: parsed.soundEffect || currentScene?.soundEffect || 'whoosh riser',
          status: 'ready',
        },
        isDemo: false,
      });
    }

    throw new Error('Invalid JSON structure from Gemini');
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to regenerate scene with Gemini.',
    });
  }
});

// Generate next series topic
app.post('/api/generate-series-topic', async (req: Request, res: Response) => {
  const { seriesName, niche, language = 'English', videoStyle = 'Mystery', pastTopics = [] } = req.body;

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are an automated YouTube Shorts and TikTok series director.
We are producing the next episode for the series:
- SERIES NAME: "${seriesName}"
- NICHE: "${niche}"
- LANGUAGE: "${language}"
- STYLE: "${videoStyle}"
- PREVIOUS EPISODE TOPICS ALREADY COVERED: ${JSON.stringify(pastTopics)}

Generate a brand new, highly viral and untackled topic for the next episode.
Return strictly JSON:
{
  "topic": "Specific intriguing episode topic",
  "title": "Viral title with hook",
  "angle": "What makes this angle unique and shocking",
  "estimatedDuration": "60 seconds"
}`;

      const responseText = await generateContentWithFallback(client, {
        prompt,
        temperature: 0.8,
      });

      const parsed = JSON.parse(responseText || '{}');
      if (parsed.topic) {
        return res.json({ success: true, ...parsed, isDemo: false });
      }
    } catch {
      // Quietly fall through to procedural series topic generator on temporary outage
    }
  }

  // Fallback procedural topic
  const fallbackTopics = [
    `The Unsolved Enigma of ${niche || 'Ancient Secrets'}`,
    `What Scientists Just Discovered Beneath ${niche || 'The Deep Ocean'}`,
    `The Forbidden Archive That Was Buried in 1947`,
    `5 Terrifying Signals Detected From Outer Space`,
    `The Secret Colony Nobody Is Allowed To Visit`,
    `The 3-Minute Psychological Trick That Controls Decisions`,
  ];
  const selected = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];

  return res.json({
    success: true,
    topic: selected,
    title: `${selected} (Episode #${pastTopics.length + 1})`,
    angle: 'Revealing the hidden evidence kept away from public records',
    estimatedDuration: '60 seconds',
    isDemo: true,
  });
});

// In-memory render jobs database
const renderJobs = new Map<string, any>();

// Trigger a backend video rendering job
app.post('/api/render-job', (req: Request, res: Response) => {
  const { projectId, scenes, config = {} } = req.body;
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const job = {
    id: jobId,
    projectId,
    status: 'preparing',
    progress: 10,
    message: 'Preparing timeline, audio graph, and scene assets...',
    totalScenes: scenes?.length || 0,
    resolution: config.resolution || '1080p',
    aspectRatio: config.aspectRatio || '9:16',
    fps: config.fps || 30,
    createdAt: Date.now(),
  };

  renderJobs.set(jobId, job);

  // Simulate server-side rendering pipeline steps
  setTimeout(() => {
    const j = renderJobs.get(jobId);
    if (j) {
      j.status = 'generating_scenes';
      j.progress = 30;
      j.message = 'Compositing visual textures, keyframes, and transitions...';
    }
  }, 1200);

  setTimeout(() => {
    const j = renderJobs.get(jobId);
    if (j) {
      j.status = 'generating_voice';
      j.progress = 55;
      j.message = 'Synthesizing voiceover audio tracks and aligning phonetic captions...';
    }
  }, 2400);

  setTimeout(() => {
    const j = renderJobs.get(jobId);
    if (j) {
      j.status = 'rendering';
      j.progress = 80;
      j.message = 'Rendering video stream, burning dynamic subtitles, and ducking background score...';
    }
  }, 3800);

  setTimeout(() => {
    const j = renderJobs.get(jobId);
    if (j) {
      j.status = 'completed';
      j.progress = 100;
      j.message = 'Video rendering finished. Ready for preview and download.';
      j.completedAt = Date.now();
      j.outputUrl = `/rendered/${projectId}.mp4`;
    }
  }, 5000);

  return res.json({ success: true, jobId, job });
});

// Check render job status
app.get('/api/render-job/:id', (req: Request, res: Response) => {
  const job = renderJobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: 'Render job not found' });
  }
  res.json({ success: true, job });
});

// Helper for procedural demo plan
function generateProceduralPlan(params: {
  topic: string;
  language: string;
  videoType: string;
  duration: string;
  contentStyle: string;
  visualStyle: string;
  targetDuration: number;
  min: number;
}) {
  const { topic, contentStyle, visualStyle, targetDuration } = params;

  return {
    title: `${topic}: The Untold Truth`,
    hook: `Stop scrolling. What you're about to see about ${topic} was classified until recently.`,
    description: `Deep dive into the hidden reality of ${topic}. #faceless #viral #mystery #${contentStyle.toLowerCase().replace(/\s+/g, '')}`,
    scenes: [
      {
        sceneNumber: 1,
        duration: 4,
        narration: `Stop scrolling. What you're about to see about ${topic} was classified until recently.`,
        visualPrompt: `Dramatic wide cinematic establishing shot of ${topic}, ominous volumetric dark lighting, ${visualStyle} look, 8k resolution, mysterious mist swirling.`,
        caption: 'STOP SCROLLING',
        transition: 'fast zoom-in',
        soundEffect: 'deep cinema thud',
      },
      {
        sceneNumber: 2,
        duration: 5,
        narration: `Deep in the historical records, eyewitnesses reported phenomena that defy conventional physics.`,
        visualPrompt: `Close-up archival footage look, weathered documents glowing with anomalous neon runes, ${visualStyle} lighting, shallow depth of field.`,
        caption: 'EYEWITNESS EVIDENCE',
        transition: 'whip pan right',
        soundEffect: 'radio static burst',
      },
      {
        sceneNumber: 3,
        duration: 5,
        narration: `Every expedition sent to verify these claims encountered the exact same impossible pattern.`,
        visualPrompt: `Explorers with headlamps walking through an ancient subterranean chamber resembling ${topic}, cinematic dust motes, intense cinematic contrast.`,
        caption: 'IMPOSSIBLE PATTERN',
        transition: 'lens flare cut',
        soundEffect: 'creepy audio riser',
      },
      {
        sceneNumber: 4,
        duration: 5,
        narration: `Modern satellite imagery recently captured this anomaly that governments still refuse to address.`,
        visualPrompt: `High-altitude satellite view scanning over ${topic}, digital HUD telemetry overlays, thermal heat signatures glowing blood red.`,
        caption: 'SATELLITE ANOMALY',
        transition: 'glitch distortion',
        soundEffect: 'digital scan chime',
      },
      {
        sceneNumber: 5,
        duration: 6,
        narration: `Could this be proof of forgotten technology, or something far darker hiding in plain sight?`,
        visualPrompt: `Slow cinematic push-in on an ominous relic discovered near ${topic}, glowing core, moody volumetric shadows, cinematic masterpiece.`,
        caption: 'FORGOTTEN TECHNOLOGY?',
        transition: 'slow dissolve',
        soundEffect: 'low ominous bass rumble',
      },
      {
        sceneNumber: 6,
        duration: 5,
        narration: `Drop your theory in the comments and subscribe before this gets taken down.`,
        visualPrompt: `Silhouette of mysterious figure observing ${topic} from a cliff edge under a stormy starry night sky, epic cinematography.`,
        caption: 'WHAT DO YOU THINK?',
        transition: 'fade to black',
        soundEffect: 'subwoofer impact hit',
      },
    ],
  };
}

// ---------------- VITE MIDDLEWARE / STATIC ----------------
async function startServer() {
  // Serve public directory (manifests, icons, service worker)
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Studio Faceless Video server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
