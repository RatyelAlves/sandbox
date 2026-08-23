export function coverScale(
  frameW: number,
  frameH: number,
  imageW: number,
  imageH: number,
  zoom: number,
) {
  return Math.max(frameW / imageW, frameH / imageH) * zoom;
}

export function clampOffset(
  x: number,
  y: number,
  frameW: number,
  frameH: number,
  imageW: number,
  imageH: number,
  zoom: number,
) {
  const scale = coverScale(frameW, frameH, imageW, imageH, zoom);
  const maxX = Math.max(0, (imageW * scale - frameW) / 2);
  const maxY = Math.max(0, (imageH * scale - frameH) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export async function cropImageToFile(
  image: HTMLImageElement,
  frame: HTMLElement,
  zoom: number,
  offset: { x: number; y: number },
  name: string,
) {
  const frameW = frame.clientWidth;
  const frameH = frame.clientHeight;
  const imageW = image.naturalWidth;
  const imageH = image.naturalHeight;
  const scale = coverScale(frameW, frameH, imageW, imageH, zoom);
  const left = (frameW - imageW * scale) / 2 + offset.x;
  const top = (frameH - imageH * scale) / 2 + offset.y;

  const sx = Math.max(0, (0 - left) / scale);
  const sy = Math.max(0, (0 - top) / scale);
  const sw = Math.min(imageW - sx, frameW / scale);
  const sh = Math.min(imageH - sy, frameH / scale);

  const outW = Math.min(1600, Math.round(sw));
  const outH = Math.max(1, Math.round(outW * (sh / sw)));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error("blob"))),
      "image/jpeg",
      0.92,
    );
  });

  const base = name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
