import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG_DIR = path.join(ROOT, "img");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png"]);

const RULES = [
  { match: /products_services/i, maxWidth: 400, quality: 82 },
  { match: /^(abstrato|animais|bebidas|caf|carros|cidades|cozinha|flores|fotografia|frases|minimalista|paisagem|pintura-aquarela|plantas|praia|religioso)/i, maxWidth: 260, quality: 80 },
  { match: /^logo$/i, maxWidth: 400, quality: 85 },
  { match: /^banner$/i, maxWidth: 1920, quality: 82 },
  { match: /^cover$/i, maxWidth: 800, quality: 82 },
  { match: /^locate$/i, maxWidth: 1920, quality: 82 },
];

function getRule(relativePath, basename) {
  const normalized = basename.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const normalizedPath = relativePath.replace(/\\/g, "/");

  if (normalizedPath.includes("products_services")) {
    return { maxWidth: 400, quality: 82 };
  }

  return RULES.find((rule) => rule.match.test(normalized) || rule.match.test(basename)) ?? {
    maxWidth: 1200,
    quality: 82,
  };
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXT.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function optimizeImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath, ext);
  const relativePath = path.relative(IMG_DIR, filePath);
  const rule = getRule(relativePath, basename);
  const webpPath = path.join(path.dirname(filePath), `${basename}.webp`);

  const input = sharp(filePath, { failOn: "none" });
  const metadata = await input.metadata();
  const width = metadata.width ?? rule.maxWidth;
  const shouldResize = width > rule.maxWidth;

  const resized = shouldResize
    ? sharp(filePath, { failOn: "none" }).resize({ width: rule.maxWidth, withoutEnlargement: true })
    : sharp(filePath, { failOn: "none" });

  const originalBefore = (await fs.stat(filePath)).size;
  const tempPath = `${filePath}.tmp`;

  if (ext === ".png") {
    await resized.png({ compressionLevel: 9, palette: metadata.hasAlpha }).toFile(tempPath);
  } else {
    await resized.jpeg({ quality: rule.quality, mozjpeg: true }).toFile(tempPath);
  }

  const tempSize = (await fs.stat(tempPath)).size;
  if (tempSize < originalBefore) {
    await fs.rename(tempPath, filePath);
  } else {
    await fs.unlink(tempPath);
  }

  const originalAfter = (await fs.stat(filePath)).size;

  await sharp(filePath, { failOn: "none" })
    .webp({ quality: rule.quality, effort: 6 })
    .toFile(webpPath);

  const webpSize = (await fs.stat(webpPath)).size;

  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    webp: path.relative(ROOT, webpPath).replace(/\\/g, "/"),
    before: originalBefore,
    after: originalAfter,
    webpSize,
    resized: shouldResize ? `${width}→${rule.maxWidth}px` : `${width}px`,
  };
}

const files = await walk(IMG_DIR);
const results = [];

for (const file of files) {
  if (file.endsWith(".webp")) continue;
  results.push(await optimizeImage(file));
}

const totalBefore = results.reduce((sum, item) => sum + item.before, 0);
const totalAfter = results.reduce((sum, item) => sum + item.after, 0);
const totalWebp = results.reduce((sum, item) => sum + item.webpSize, 0);

console.log("\nOtimização concluída:\n");
for (const item of results) {
  console.log(
    `${item.file}\n  original: ${formatBytes(item.before)} → ${formatBytes(item.after)} (${item.resized})\n  webp:     ${formatBytes(item.webpSize)}`
  );
}

console.log("\n--- Totais ---");
console.log(`Originais: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}`);
console.log(`WebP:      ${formatBytes(totalWebp)}`);
console.log(`Economia WebP vs original: ${formatBytes(totalBefore - totalWebp)} (${(((totalBefore - totalWebp) / totalBefore) * 100).toFixed(1)}%)`);
