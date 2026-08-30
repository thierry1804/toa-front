import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "images", "TOA.png");
const iconsDir = path.join(root, "public", "icons");
const BACKGROUND = "#f9fafb";

await mkdir(iconsDir, { recursive: true });

async function squareIcon(size, paddingRatio, dest) {
  const inner = Math.round(size * (1 - paddingRatio * 2));
  const logo = await sharp(source)
    .resize(inner, inner, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(dest);
}

await squareIcon(192, 0.1, path.join(iconsDir, "icon-192.png"));
await squareIcon(512, 0.1, path.join(iconsDir, "icon-512.png"));
await squareIcon(512, 0.2, path.join(iconsDir, "icon-512-maskable.png"));
await squareIcon(180, 0.1, path.join(root, "public", "apple-touch-icon.png"));

console.log("PWA icons generated from public/images/TOA.png");
