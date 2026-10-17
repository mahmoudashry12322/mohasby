import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Standard App Icon matching public/favicon.svg exactly
function generateOriginalSvg(size) {
  const rx = Math.round(size * (10 / 48)); // exact 10/48 ratio from favicon.svg
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" rx="${10}" fill="#1F4E42"/>
  <path d="M24 9C15.7157 9 9 15.7157 9 24C9 32.2843 15.7157 39 24 39C32.2843 39 39 32.2843 39 24C39 20.9 38.07 18.04 36.47 15.65" stroke="#FFFFFF" stroke-width="3.8" stroke-linecap="round"/>
  <path d="M36 15L40 10M36 15V24" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M18 24.5L22.5 29L31 18" stroke="#28A78F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// 2. Maskable Icon with full-bleed background and 20% safe-zone margin for Android adaptive icons
function generateMaskableSvg(size) {
  const targetInner = 48 * 0.72; // 72% inner size for safe zone
  const offset = (48 - targetInner) / 2;
  const scale = targetInner / 48;

  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#1F4E42"/>
  <g transform="translate(${offset.toFixed(2)}, ${offset.toFixed(2)}) scale(${scale.toFixed(3)})">
    <path d="M24 9C15.7157 9 9 15.7157 9 24C9 32.2843 15.7157 39 24 39C32.2843 39 39 32.2843 39 24C39 20.9 38.07 18.04 36.47 15.65" stroke="#FFFFFF" stroke-width="3.8" stroke-linecap="round"/>
    <path d="M36 15L40 10M36 15V24" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M18 24.5L22.5 29L31 18" stroke="#28A78F" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function buildIcons() {
  const configs = [
    { name: 'icon-48x48.png', size: 48, maskable: false },
    { name: 'icon-96x96.png', size: 96, maskable: false },
    { name: 'icon-192x192.png', size: 192, maskable: false },
    { name: 'icon-512x512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192x192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const cfg of configs) {
    const svg = cfg.maskable ? generateMaskableSvg(cfg.size) : generateOriginalSvg(cfg.size);
    const dest = path.join(iconsDir, cfg.name);
    await sharp(Buffer.from(svg), { density: 300 })
      .resize(cfg.size, cfg.size)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`Generated ${cfg.name} (${cfg.size}x${cfg.size}) matching exact original favicon.svg`);
  }
}

buildIcons().catch(console.error);
