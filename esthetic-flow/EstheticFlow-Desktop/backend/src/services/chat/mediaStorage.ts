import fs from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(
  process.cwd(),
  "uploads",
  "chat"
);

function extensionFromMime(
  mimeType?: string | null
) {

  if (!mimeType) {
    return "bin";
  }

  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "audio/ogg": "ogg",
    "audio/ogg; codecs=opus": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "application/pdf": "pdf",
  };

  if (map[mimeType]) {
    return map[mimeType];
  }

  const [, subtype] =
    mimeType.split("/");

  return subtype?.split(";")[0] || "bin";
}

export function getMediaAbsolutePath(
  mediaPath: string
) {
  return path.join(
    UPLOADS_ROOT,
    mediaPath
  );
}

export async function saveMessageMedia(
  messageId: string,
  base64: string,
  mimeType?: string | null,
  fileName?: string | null
) {

  await fs.mkdir(UPLOADS_ROOT, {
    recursive: true,
  });

  let extension =
    extensionFromMime(mimeType);

  if (fileName?.includes(".")) {
    const fromName = fileName
      .split(".")
      .pop()
      ?.toLowerCase();

    if (fromName) {
      extension = fromName;
    }
  }

  const relativePath = `${messageId}.${extension}`;
  const absolutePath =
    getMediaAbsolutePath(relativePath);

  const buffer = Buffer.from(
    base64,
    "base64"
  );

  await fs.writeFile(
    absolutePath,
    buffer
  );

  return relativePath;
}

export async function readMessageMedia(
  mediaPath: string
) {

  const absolutePath =
    getMediaAbsolutePath(mediaPath);

  return fs.readFile(absolutePath);
}

export async function deleteMessageMedia(
  mediaPath?: string | null
) {

  if (!mediaPath) {
    return;
  }

  try {
    await fs.unlink(
      getMediaAbsolutePath(mediaPath)
    );
  } catch {
    // ignore missing files
  }
}
