import { MusicMood } from '../../types';

export interface MusicTrackOption {
  id: string;
  name: string;
  mood: MusicMood;
  tempo: string;
  description: string;
  royaltyFree: boolean;
}

export class MusicProvider {
  private activeAudioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;
  private currentMood: MusicMood = 'Suspense';

  getAvailableTracks(): MusicTrackOption[] {
    return [
      {
        id: 'track-suspense-drone',
        name: 'Dark Void (Ambient Suspense)',
        mood: 'Suspense',
        tempo: 'Slow (65 BPM)',
        description: 'Deep sub-bass drone with eerie harmonic overtones, ideal for mysteries & horror.',
        royaltyFree: true,
      },
      {
        id: 'track-cinematic-impact',
        name: 'Titan Horizon (Cinematic)',
        mood: 'Cinematic',
        tempo: 'Medium (90 BPM)',
        description: 'Orchestral tension chords with rich cinematic depth, ideal for documentaries.',
        royaltyFree: true,
      },
      {
        id: 'track-motivational-riser',
        name: 'Ascend (Motivational)',
        mood: 'Motivational',
        tempo: 'Uplifting (110 BPM)',
        description: 'Warm analog synthesizer arpeggios that build positive momentum.',
        royaltyFree: true,
      },
      {
        id: 'track-calm-zenith',
        name: 'Celestial Stillness (Calm)',
        mood: 'Calm',
        tempo: 'Gentle (60 BPM)',
        description: 'Soothing crystal sine pads for relaxed educational and factual narratives.',
        royaltyFree: true,
      },
      {
        id: 'track-energetic-pulse',
        name: 'Cybernetic Rush (Energetic)',
        mood: 'Energetic',
        tempo: 'Fast (128 BPM)',
        description: 'High-octane rhythmic pulse designed for viral retention.',
        royaltyFree: true,
      },
      {
        id: 'track-emotional-nocturne',
        name: 'Echoes of Time (Emotional)',
        mood: 'Emotional',
        tempo: 'Slow (72 BPM)',
        description: 'Melancholic chord progressions for dramatic storytelling.',
        royaltyFree: true,
      },
    ];
  }

  /**
   * Preview music in browser matching mood and volume
   */
  startPreview(mood: MusicMood, volume: number = 0.4): void {
    this.stopPreview();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      this.activeAudioContext = ctx;
      this.currentMood = mood;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(Math.max(0.01, volume * 0.35), ctx.currentTime);
      gain.connect(ctx.destination);
      this.masterGain = gain;

      this.oscillators = [];

      // Mood chord frequencies (Hz)
      const moodChords: Record<MusicMood, number[]> = {
        Suspense: [65.41, 77.78, 130.81, 155.56], // C2, Eb2, C3, Eb3 (Dark Minor)
        Cinematic: [55.0, 110.0, 164.81, 220.0], // A1, A2, E3, A3 (Epic Power 5th)
        Motivational: [65.41, 130.81, 196.0, 246.94], // C2, C3, G3, B3 (Major 7th)
        Calm: [87.31, 130.81, 174.61, 261.63], // F2, C3, F3, C4 (Pure 5ths)
        Energetic: [73.42, 146.83, 220.0, 293.66], // D2, D3, A3, D4 (Driving Octaves)
        Emotional: [55.0, 82.41, 110.0, 164.81], // A1, E2, A2, E3 (Sentimental Minor)
      };

      const freqs = moodChords[mood] || moodChords.Suspense;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const oscGain = ctx.createGain();

        osc.type = idx === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(mood === 'Energetic' ? 1200 : 500 + idx * 150, ctx.currentTime);

        oscGain.gain.setValueAtTime(0.2 / freqs.length, ctx.currentTime);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(gain);

        osc.start();
        this.oscillators.push(osc);
      });

      this.isPlaying = true;
    } catch (e) {
      console.warn('Music preview initialization error:', e);
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain && this.activeAudioContext) {
      this.masterGain.gain.setValueAtTime(
        Math.max(0.01, volume * 0.35),
        this.activeAudioContext.currentTime
      );
    }
  }

  stopPreview(): void {
    if (this.oscillators.length > 0) {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Ignore
        }
      });
      this.oscillators = [];
    }

    if (this.activeAudioContext && this.activeAudioContext.state !== 'closed') {
      this.activeAudioContext.close().catch(() => {});
      this.activeAudioContext = null;
    }

    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const musicProvider = new MusicProvider();
