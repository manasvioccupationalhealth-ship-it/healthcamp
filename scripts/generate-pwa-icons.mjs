import fs from "fs";
import path from "path";
import sharp from "sharp";

const iconsDir = path.resolve(process.cwd(), "public", "icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Crisp, high-end medical cross + cardiogram heartbeat SVG
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#2563eb" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />

  <!-- Subtle inner border -->
  <rect x="8" y="8" width="496" height="496" rx="104" fill="none" stroke="#334155" stroke-width="3" stroke-opacity="0.6" />

  <!-- Ambient glow circle -->
  <circle cx="256" cy="256" r="180" fill="url(#glowGrad)" opacity="0.15" />

  <!-- Shield / Cross base -->
  <g filter="url(#shadow)">
    <!-- Vertical bar -->
    <rect x="220" y="116" width="72" height="280" rx="20" fill="url(#crossGrad)" />
    <!-- Horizontal bar -->
    <rect x="116" y="220" width="280" height="72" rx="20" fill="url(#crossGrad)" />
  </g>

  <!-- Pulse / ECG Heartbeat Line -->
  <path
    d="M 120 256 L 195 256 L 220 180 L 256 332 L 292 216 L 316 256 L 392 256"
    fill="none"
    stroke="#ffffff"
    stroke-width="18"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Subtle stethoscope / health dot -->
  <circle cx="256" cy="148" r="10" fill="#ffffff" opacity="0.9" />
</svg>
`;

fs.writeFileSync(path.join(iconsDir, "icon.svg"), svgContent.trim());

async function generate() {
  const svgBuffer = Buffer.from(svgContent);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192x192.png"));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512x512.png"));

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, "apple-touch-icon.png"));

  // Maskable 512x512 with safe area margin
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(path.join(iconsDir, "icon-maskable-512x512.png"));

  console.log("PWA icons generated successfully in public/icons/");
}

generate().catch(console.error);
