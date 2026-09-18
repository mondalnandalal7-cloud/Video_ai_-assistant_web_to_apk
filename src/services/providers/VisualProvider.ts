import { VisualStyle, AspectRatio } from '../../types';

export interface VisualResult {
  url: string;
  type: 'image' | 'video';
  provider: 'gemini_image' | 'stock_library' | 'procedural_generator';
  prompt: string;
  isDemo: boolean;
}

export interface VisualProviderInterface {
  generateSceneVisual(
    prompt: string,
    style: VisualStyle,
    aspectRatio: AspectRatio,
    sceneNumber: number,
    topic: string
  ): Promise<VisualResult>;
  isApiConfigured(): Promise<boolean>;
}

export class VisualProvider implements VisualProviderInterface {
  /**
   * Checks if an external AI image/video API is configured
   */
  async isApiConfigured(): Promise<boolean> {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        return !!data.imageConfigured;
      }
    } catch {
      // Offline fallback
    }
    return false;
  }

  /**
   * Generates or retrieves an appropriate visual for a scene.
   * If an external AI provider is configured, queries it; otherwise generates
   * a high-aesthetic procedural visual card and clearly labels it as DEMO MODE.
   */
  async generateSceneVisual(
    prompt: string,
    style: VisualStyle,
    aspectRatio: AspectRatio,
    sceneNumber: number,
    topic: string
  ): Promise<VisualResult> {
    const isConfigured = await this.isApiConfigured();

    if (isConfigured) {
      try {
        const res = await fetch('/api/generate-scene-visual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, style, aspectRatio, sceneNumber, topic }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.configured && data.url) {
            return {
              url: data.url,
              type: data.type || 'image',
              provider: 'gemini_image',
              prompt,
              isDemo: false,
            };
          }
        }
      } catch (err) {
        console.warn('AI image generation API call failed, falling back to procedural engine:', err);
      }
    }

    // High-resolution procedural canvas-based cinematic generator
    const proceduralUrl = this.createProceduralVisual(prompt, style, aspectRatio, sceneNumber, topic);
    return {
      url: proceduralUrl,
      type: 'image',
      provider: 'procedural_generator',
      prompt,
      isDemo: true,
    };
  }

  /**
   * Generates a cinematic visual texture using HTML5 canvas
   */
  public createProceduralVisual(
    prompt: string,
    style: VisualStyle,
    aspectRatio: AspectRatio,
    sceneNumber: number,
    topic: string
  ): string {
    if (typeof document === 'undefined') return '';

    const [width, height] = aspectRatio === '9:16' ? [720, 1280] : aspectRatio === '1:1' ? [900, 900] : [1280, 720];

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Color palettes tuned for faceless video genres
    const palettes: Record<string, [string, string, string, string]> = {
      Cinematic: ['#090A0F', '#181E2E', '#2B395B', '#E5A93C'], // Deep amber & navy
      Dark: ['#030305', '#0E0F14', '#1F2430', '#6366F1'], // Pitch black with violet pulse
      Realistic: ['#0A1118', '#16222F', '#243A4E', '#38BDF8'], // Atmospheric cyan & charcoal
      Documentary: ['#0C0D10', '#1B1C22', '#2A2B35', '#F59E0B'], // Sepia warm gold & charcoal
      'AI Art': ['#090514', '#1F1138', '#431E70', '#EC4899'], // Neon cyberpunk magenta
      Minimal: ['#050505', '#121212', '#262626', '#E2E8F0'], // Monochrome slate
      Custom: ['#0B0F19', '#111827', '#1F2937', '#10B981'], // Emerald glow
    };

    const [c1, c2, c3, accent] = palettes[style] || palettes.Cinematic;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, width * 0.8, height);
    grad.addColorStop(0, c1);
    grad.addColorStop(0.5, c2);
    grad.addColorStop(1, c3);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Atmospheric lighting spotlight
    const spotX = (sceneNumber * 137) % width;
    const spotY = height * 0.35;
    const spot = ctx.createRadialGradient(spotX, spotY, 20, spotX, spotY, width * 0.7);
    spot.addColorStop(0, `${accent}44`);
    spot.addColorStop(0.4, `${accent}11`);
    spot.addColorStop(1, 'transparent');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);

    // Geometric perspective lines / cinematic grid
    ctx.strokeStyle = `${accent}18`;
    ctx.lineWidth = 1.5;
    const horizon = height * 0.65;
    const vanishX = width * 0.5;

    for (let x = -width * 0.5; x <= width * 1.5; x += width * 0.15) {
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Floating particles & cinematic bokeh dust
    const seed = sceneNumber * 42;
    for (let i = 0; i < 40; i++) {
      const px = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * width;
      const py = ((seed * (i + 2) * 49297 + 9301) % 233280) / 233280 * height;
      const size = (((seed * (i + 3)) % 10) / 2) + 1.5;
      const alpha = (((seed * (i + 4)) % 50) / 100) + 0.15;

      ctx.fillStyle = i % 3 === 0 ? accent : '#FFFFFF';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Cinematic vignette
    const vig = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);

    // Decorative HUD framing & scene indicator
    ctx.strokeStyle = `${accent}55`;
    ctx.lineWidth = 2;
    const pad = 36;
    // Top-left corner bracket
    ctx.beginPath();
    ctx.moveTo(pad, pad + 30);
    ctx.lineTo(pad, pad);
    ctx.lineTo(pad + 30, pad);
    ctx.stroke();

    // Bottom-right corner bracket
    ctx.beginPath();
    ctx.moveTo(width - pad, height - pad - 30);
    ctx.lineTo(width - pad, height - pad);
    ctx.lineTo(width - pad - 30, height - pad);
    ctx.stroke();

    // Scene badge & prompt preview on canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    const badgeW = 200;
    const badgeH = 40;
    ctx.fillRect(pad, height - pad - badgeH, badgeW, badgeH);

    ctx.fillStyle = accent;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`SCENE 0${sceneNumber} // ${style.toUpperCase()}`, pad + 14, height - pad - 14);

    // Center visual icon / concept monogram
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.42, 64, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `${accent}66`;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Center graphic glyph
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`0${sceneNumber}`, width / 2, height * 0.42 + 12);

    return canvas.toDataURL('image/jpeg', 0.88);
  }
}

export const visualProvider = new VisualProvider();
