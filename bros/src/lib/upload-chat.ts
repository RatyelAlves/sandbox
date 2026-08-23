import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";

export const MEDIA_UNSEND_MS = 60_000;

const IMAGE = ["image/jpeg", "image/png", "image/webp"];
const VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 30 * 1024 * 1024;

export function isChatImage(mime?: string | null, path?: string | null) {
  if (mime?.startsWith("image/")) return true;
  return Boolean(path?.match(/\.(jpe?g|png|webp)$/i));
}

export function isChatVideo(mime?: string | null, path?: string | null) {
  if (mime?.startsWith("video/")) return true;
  return Boolean(path?.match(/\.(mp4|webm|mov)$/i));
}

export function mapLink(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export async function uploadChatAttachment({
  conversationId,
  userId,
  file,
}: {
  conversationId: string;
  userId: string;
  file: File;
}) {
  const image = IMAGE.includes(file.type);
  const video = VIDEO.includes(file.type);
  if (!image && !video) {
    return { error: "Use foto (JPG, PNG, WebP) ou vídeo (MP4, WebM).", path: null };
  }
  if (image && file.size > IMAGE_MAX) {
    return { error: "A foto precisa ter menos de 8 MB.", path: null };
  }
  if (video && file.size > VIDEO_MAX) {
    return { error: "O vídeo precisa ter menos de 30 MB.", path: null };
  }

  const id = crypto.randomUUID();
  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : file.type.includes("webm")
        ? "webm"
        : file.type.includes("quicktime")
          ? "mov"
          : file.type.includes("mp4")
            ? "mp4"
            : "jpg";
  const path = `${conversationId}/${userId}/${id}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("chat").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return {
      error: "Rode o SQL supabase/chat-attachments.sql e chat-media.sql no Supabase.",
      path: null,
    };
  }

  return { error: null, path };
}

export function mediaUnsendLeft(createdAt: string, now = Date.now()) {
  return Math.max(0, new Date(createdAt).getTime() + MEDIA_UNSEND_MS - now);
}

export async function unsendChatMedia(message: Message) {
  if (!message.attachment_path) {
    return { error: "Só dá para apagar foto ou vídeo." };
  }
  if (mediaUnsendLeft(message.created_at) <= 0) {
    return { error: "Já passou de 1 minuto." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("messages").delete().eq("id", message.id);
  if (error) {
    return { error: "Rode o SQL supabase/chat-unsend.sql no Supabase." };
  }
  await supabase.storage.from("chat").remove([message.attachment_path]);
  return { error: null };
}
