import { createClient } from "@/lib/supabase/client";
import type { PhotoKind } from "@/lib/types";

export async function uploadPhotoFile({
  userId,
  file,
  kind,
  isPrivate,
  albumId,
}: {
  userId: string;
  file: File;
  kind: PhotoKind;
  isPrivate: boolean;
  albumId?: string | null;
}) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Use JPG, PNG ou WebP." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "A foto precisa ter menos de 5 MB." };
  }

  const id = crypto.randomUUID();
  const ext =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${id}.${ext}`;
  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Falha no envio da foto." };

  const { error: insertError } = await supabase.from("photos").insert({
    id,
    user_id: userId,
    kind,
    is_private: isPrivate,
    path,
    album_id: albumId ?? null,
  });

  if (insertError) {
    return { error: "A foto foi enviada, mas não entrou no perfil." };
  }

  return { error: null, id };
}
