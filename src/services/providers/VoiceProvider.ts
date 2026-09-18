import { VoiceConfig, VoiceOption, VoiceInput, VoiceResult } from '../../types';
import { storageService } from '../storage';

export interface VoiceProviderInterface {
  getAvailableVoices(): VoiceOption[];
  previewVoice(text: string, config: VoiceConfig, language?: string): Promise<void>;
  stopVoice(): void;
  generateSpeech(input: VoiceInput & { demoMode?: boolean }): Promise<VoiceResult>;
  generateSceneAudio(text: string, config: VoiceConfig): Promise<{ audioUrl: string; duration: number; isDemo: boolean }>;
  isConfigured(): Promise<boolean>;
}

export class VoiceProvider implements VoiceProviderInterface {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  getAvailableVoices(): VoiceOption[] {
    return [
      {
        id: 'male-deep-cinematic',
        name: 'Alex / Charon (Cinematic Deep)',
        gender: 'Male',
        language: 'English',
        accent: 'US Dramatic',
        tone: 'Deep, serious, authoritative, perfect for mystery and documentaries',
      },
      {
        id: 'female-mysterious',
        name: 'Sarah / Aoede (Ominous Mystery)',
        gender: 'Female',
        language: 'English',
        accent: 'UK Smooth',
        tone: 'Captivating, whisper-crisp, suspenseful storytelling',
      },
      {
        id: 'male-motivational',
        name: 'Marcus / Fenrir (High Energy)',
        gender: 'Male',
        language: 'English',
        accent: 'US Bold',
        tone: 'Energetic, urgent, high retention, perfect for viral shorts',
      },
      {
        id: 'female-documentary',
        name: 'Elena / Kore (Warm Documentary)',
        gender: 'Female',
        language: 'English',
        accent: 'International',
        tone: 'Articulate, clear, journalistic and educational',
      },
      {
        id: 'male-hindi-kabir',
        name: 'Kabir / Charon (Dramatic Hindi)',
        gender: 'Male',
        language: 'Hindi',
        accent: 'Standard Hindi',
        tone: 'Deep resonance, mystery, horror and historical stories',
      },
      {
        id: 'female-hindi-priya',
        name: 'Priya / Kore (Engaging Hindi)',
        gender: 'Female',
        language: 'Hindi',
        accent: 'Standard Hindi',
        tone: 'Fast, clear, compelling short storytelling',
      },
      {
        id: 'male-bengali-rohit',
        name: 'Rohit / Puck (Bengali Narrative)',
        gender: 'Male',
        language: 'Bengali',
        accent: 'Standard Bengali',
        tone: 'Deep storytelling, emotional cadence',
      },
      {
        id: 'female-tamil-ananya',
        name: 'Ananya / Aoede (Tamil Pulse)',
        gender: 'Female',
        language: 'Tamil',
        accent: 'Standard Tamil',
        tone: 'Clear, dramatic pace, educational and facts',
      },
    ];
  }

  /**
   * Check if real TTS voice provider is configured.
   */
  async isConfigured(): Promise<boolean> {
    try {
      const settings = storageService.getSettings();
      // If user enabled Gemini TTS engine in app settings, it is configured
      if (settings.ttsEngine === 'gemini') {
        return true;
      }
      if (settings.ttsEngine === 'demo') {
        return false;
      }

      const res = await fetch('/api/tts-status');
      if (res.ok) {
        const data = await res.json();
        // If hasTTSKey is set in environment, or gemini engine is preferred
        return !!data.hasTTSKey || (settings.ttsEngine !== 'custom' && !!data.geminiAvailable);
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generates speech for narration using the configured voice engine.
   * Calls server-side endpoint /api/generate-speech to guarantee zero client secret exposure.
   */
  async generateSpeech(input: VoiceInput & { demoMode?: boolean }): Promise<VoiceResult> {
    const settings = storageService.getSettings();
    const isExplicitDemo = input.demoMode === true || settings.ttsEngine === 'demo';

    try {
      const response = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: input.text,
          voiceConfig: input.voiceConfig,
          language: input.language || 'English',
          demoMode: isExplicitDemo,
          engine: settings.ttsEngine || 'gemini',
        }),
      });

      if (!response.ok) {
        let errorMsg = `Voice generation failed (${response.status})`;
        try {
          const errData = await response.json();
          if (errData.error) {
            errorMsg = errData.error;
          }
        } catch {
          // fallback to status text
          if (response.status === 429) {
            errorMsg = 'Voice rate limit reached. Please wait a moment and retry.';
          } else if (response.status === 503) {
            errorMsg = 'Voice server busy. Please try again.';
          }
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (!result.audioUrl) {
        throw new Error(result.error || 'Empty audio returned by voice service');
      }

      return {
        audioUrl: result.audioUrl,
        duration: result.duration || 4,
        format: result.format || 'audio/wav',
        provider: result.provider || (isExplicitDemo ? 'demo_synthesizer' : 'gemini-3.1-flash-tts'),
        isDemo: !!result.isDemo,
      };
    } catch (err: any) {
      // If error occurred during real generation, propagate clean message for retry
      if (!isExplicitDemo) {
        throw err;
      }

      // Safe local demo synthesis fallback for offline/demo mode
      const words = input.text.trim().split(/\s+/).length;
      const estimatedDuration = Math.max(2.0, Math.min(12, Math.round((words / 2.5) * 10) / 10));
      const audioUrl = await this.synthesizeSpeechAudioDataUrl(input.text, estimatedDuration, input.voiceConfig);
      return {
        audioUrl,
        duration: estimatedDuration,
        format: 'audio/wav',
        provider: 'demo_synthesizer',
        isDemo: true,
      };
    }
  }

  /**
   * Backwards compatible helper for scene audio generation
   */
  async generateSceneAudio(
    text: string,
    config: VoiceConfig
  ): Promise<{ audioUrl: string; duration: number; isDemo: boolean }> {
    const res = await this.generateSpeech({ text, voiceConfig: config });
    return {
      audioUrl: res.audioUrl,
      duration: res.duration,
      isDemo: !!res.isDemo,
    };
  }

  /**
   * Preview voice in browser with specified speed, pitch, volume
   */
  async previewVoice(text: string, config: VoiceConfig, language?: string): Promise<void> {
    this.stopVoice();

    // Check if we can preview via actual audio url if generated or via speech synthesis
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      await this.playSyntheticChime();
      return;
    }

    return new Promise((resolve) => {
      const sample = text || 'Welcome to this episode. Pay close attention to what happens next.';
      const utterance = new SpeechSynthesisUtterance(sample);

      utterance.rate = Math.max(0.5, Math.min(2.0, config.speed));
      utterance.pitch = Math.max(0.5, Math.min(1.5, config.pitch));
      utterance.volume = Math.max(0.0, Math.min(1.0, config.volume));

      // Try finding system voice matching gender/language
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const langCode = (language || config.voiceId || '').toLowerCase();
        const langLower = langCode.includes('hindi') ? 'hi' :
                          langCode.includes('bengali') ? 'bn' :
                          langCode.includes('tamil') ? 'ta' : 'en';

        const matched = voices.find((v) =>
          v.lang.toLowerCase().startsWith(langLower) &&
          (config.gender === 'Female' ? /female|woman|zira|samantha|victoria/i.test(v.name) : /male|man|david|daniel|george/i.test(v.name))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(langLower)) || voices[0];

        if (matched) {
          utterance.voice = matched;
        }
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Plays a generated audio URL directly (used for scene preview)
   */
  async playAudioUrl(audioUrl: string, onEnded?: () => void): Promise<void> {
    this.stopVoice();
    if (!audioUrl) return;

    try {
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;
      audio.onended = () => {
        this.currentAudioElement = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        this.currentAudioElement = null;
        if (onEnded) onEnded();
      };
      await audio.play();
    } catch {
      this.currentAudioElement = null;
      if (onEnded) onEnded();
    }
  }

  stopVoice(): void {
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
        this.currentAudioElement = null;
      }
    }
    this.currentUtterance = null;
  }

  private async playSyntheticChime(): Promise<void> {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Generates a lightweight synthetic audio buffer with spoken waveform envelope
   * so video rendering and demo preview have actual audible voice track!
   */
  private async synthesizeSpeechAudioDataUrl(
    text: string,
    durationSec: number,
    config: VoiceConfig
  ): Promise<string> {
    const sampleRate = 22050;
    const totalSamples = Math.floor(sampleRate * durationSec);
    const wavBuffer = new ArrayBuffer(44 + totalSamples * 2);
    const view = new DataView(wavBuffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + totalSamples * 2, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, totalSamples * 2, true);

    const baseFreq = (config.gender === 'Female' ? 220 : 130) * config.pitch;
    const words = text.split(' ').length;
    const syllableRate = (words * 2.5) / durationSec;

    let offset = 44;
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.sin(t * Math.PI * 2 * syllableRate);
      const amp = Math.max(0, envelope) * config.volume;

      const f1 = Math.sin(t * Math.PI * 2 * baseFreq);
      const f2 = Math.sin(t * Math.PI * 2 * (baseFreq * 2.1)) * 0.4;
      const f3 = Math.sin(t * Math.PI * 2 * (baseFreq * 3.2)) * 0.2;
      const sample = (f1 + f2 + f3) * amp * 0.45;

      const int16 = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    const blob = new Blob([view], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const voiceProvider = new VoiceProvider();
