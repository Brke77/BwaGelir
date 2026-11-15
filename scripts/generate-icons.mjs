import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
await mkdir(new URL("../public/icons/", import.meta.url), { recursive: true });
for (const [file, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#526b43"/><g transform="translate(8 8) scale(.75)"><path d="M16 45V25a10 10 0 0 1 10-10h5v30H16Zm19 4V19h5a10 10 0 0 1 10 10v20H35Z" fill="#f4f6ec"/></g></svg>`;
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/icons/${file}`, import.meta.url)));
}
