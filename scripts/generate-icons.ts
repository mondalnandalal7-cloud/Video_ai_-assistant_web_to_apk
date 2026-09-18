import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width: number, height: number, drawFn: (x: number, y: number, w: number, h: number) => [number, number, number, number]): Buffer {
  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const idx = y * rowSize + 1 + x * 4;
      raw[idx] = r;
      raw[idx + 1] = g;
      raw[idx + 2] = b;
      raw[idx + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(raw);

  function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflated),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Icon Drawer: Deep slate background with glowing indigo/cyan film frame and play triangle
function drawAppIcon(isMaskable: boolean) {
  return (x: number, y: number, w: number, h: number): [number, number, number, number] => {
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;

    // Corner rounding for regular icon
    if (!isMaskable) {
      const radius = 0.82;
      const cornerR = 0.35;
      const ax = Math.max(0, Math.abs(nx) - (radius - cornerR));
      const ay = Math.max(0, Math.abs(ny) - (radius - cornerR));
      const dist = Math.sqrt(ax * ax + ay * ay);
      if (dist > cornerR) {
        return [0, 0, 0, 0];
      }
    }

    // Background Gradient (Deep Studio Dark with Indigo-Violet tint)
    const diag = (nx + ny) * 0.5;
    const bgR = Math.round(11 + 15 * (diag + 1) * 0.5);
    const bgG = Math.round(15 + 20 * (diag + 1) * 0.5);
    const bgB = Math.round(23 + 45 * (diag + 1) * 0.5);

    // Scaling factor (maskable icon has 20% safe-zone margin)
    const scale = isMaskable ? 0.75 : 1.0;
    const sx = nx / scale;
    const sy = ny / scale;

    // Outer glow ring
    const ringDist = Math.sqrt(sx * sx + sy * sy);
    let r = bgR;
    let g = bgG;
    let b = bgB;
    const a = 255;

    // Subtle radial glow from center
    if (ringDist < 0.85) {
      const glow = Math.max(0, 1 - ringDist / 0.85);
      r = Math.min(255, Math.round(r + 40 * glow));
      g = Math.min(255, Math.round(g + 30 * glow));
      b = Math.min(255, Math.round(b + 90 * glow));
    }

    // Play Triangle Shape (Facing right, centered around (-0.05, 0))
    // Triangle vertices: (-0.28, -0.32), (-0.28, 0.32), (0.35, 0.0)
    const px = sx + 0.05;
    const py = sy;
    const insidePlay = px >= -0.28 && px <= 0.35 && Math.abs(py) <= (0.35 - px) * 0.55;

    if (insidePlay) {
      // Vibrant indigo-to-cyan gradient
      const grad = (px + 0.28) / 0.63;
      const playR = Math.round(99 * (1 - grad) + 6 * grad);
      const playG = Math.round(102 * (1 - grad) + 182 * grad);
      const playB = Math.round(241 * (1 - grad) + 212 * grad);
      return [playR, playG, playB, 255];
    }

    // Sparkle star at top right (sx: 0.35, sy: -0.35)
    const starDist = Math.abs(sx - 0.36) + Math.abs(sy + 0.36);
    if (starDist < 0.15) {
      return [255, 255, 255, 255];
    }

    return [r, g, b, a];
  };
}

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA 192x192
const pwa192 = createPng(192, 192, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

// Generate PWA 512x512
const pwa512 = createPng(512, 512, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

// Generate PWA Maskable 512x512 (with safe zone)
const pwaMaskable = createPng(512, 512, drawAppIcon(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

// Generate Apple Touch Icon 180x180
const appleTouch = createPng(180, 180, drawAppIcon(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

// Generate crisp SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17" />
      <stop offset="50%" stop-color="#141B2D" />
      <stop offset="100%" stop-color="#05070B" />
    </linearGradient>
    <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366F1" />
      <stop offset="50%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#06B6D4" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <circle cx="256" cy="256" r="210" fill="url(#glow)" />
  <rect x="36" y="36" width="440" height="440" rx="90" fill="none" stroke="#6366F1" stroke-width="4" stroke-opacity="0.3" />
  <!-- Film reel markers -->
  <circle cx="90" cy="90" r="10" fill="#6366F1" fill-opacity="0.5" />
  <circle cx="422" cy="90" r="10" fill="#6366F1" fill-opacity="0.5" />
  <circle cx="90" cy="422" r="10" fill="#6366F1" fill-opacity="0.5" />
  <circle cx="422" cy="422" r="10" fill="#6366F1" fill-opacity="0.5" />
  <!-- Main Play Triangle -->
  <path d="M 200 160 L 360 256 L 200 352 Z" fill="url(#playGrad)" />
  <!-- AI Sparkle -->
  <path d="M 370 140 Q 370 160 390 160 Q 370 160 370 180 Q 370 160 350 160 Q 370 160 370 140 Z" fill="#FFFFFF" />
  <!-- Sub Sparkle -->
  <path d="M 150 340 Q 150 350 160 350 Q 150 350 150 360 Q 150 350 140 350 Q 150 350 150 340 Z" fill="#06B6D4" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('Successfully generated PWA icon assets:');
console.log('- /public/pwa-192x192.png');
console.log('- /public/pwa-512x512.png');
console.log('- /public/pwa-maskable-512x512.png');
console.log('- /public/apple-touch-icon.png');
console.log('- /public/icon.svg');
