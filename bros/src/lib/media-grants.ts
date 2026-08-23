import { notifyAlbumGrant } from "@/lib/chat-grant";
import { accessFromGrantRows, EMPTY_ACCESS, hasAnyAccess } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { MediaAccess, MediaGrant } from "@/lib/types";

type Client = ReturnType<typeof createClient>;

export async function loadAccessForViewer(
  supabase: Client,
  ownerId: string,
  viewerId: string,
): Promise<MediaAccess> {
  const [{ data: legacy }, media] = await Promise.all([
    supabase
      .from("photo_grants")
      .select("viewer_id")
      .eq("owner_id", ownerId)
      .eq("viewer_id", viewerId)
      .maybeSingle(),
    supabase
      .from("media_grants")
      .select("scope, album_id, photo_id")
      .eq("owner_id", ownerId)
      .eq("viewer_id", viewerId),
  ]);

  if (media.error) {
    return accessFromGrantRows(Boolean(legacy), []);
  }

  return accessFromGrantRows(
    Boolean(legacy),
    (media.data ?? []) as Array<Pick<MediaGrant, "scope" | "album_id" | "photo_id">>,
  );
}

export async function saveMediaAccess(
  supabase: Client,
  ownerId: string,
  viewerId: string,
  access: MediaAccess,
  options?: { notice?: string | null; conversationId?: string | null },
) {
  const { error: mediaDeleteError } = await supabase
    .from("media_grants")
    .delete()
    .eq("owner_id", ownerId)
    .eq("viewer_id", viewerId);

  if (mediaDeleteError) {
    return {
      error:
        "Rode o SQL supabase/media-grants.sql no Supabase para liberar fotos.",
    };
  }

  await supabase
    .from("photo_grants")
    .delete()
    .eq("owner_id", ownerId)
    .eq("viewer_id", viewerId);

  const rows: Array<{
    owner_id: string;
    viewer_id: string;
    scope: "all" | "album" | "photo";
    album_id: string | null;
    photo_id: string | null;
  }> = [];

  if (access.all) {
    rows.push({
      owner_id: ownerId,
      viewer_id: viewerId,
      scope: "all",
      album_id: null,
      photo_id: null,
    });
    await supabase.from("photo_grants").insert({
      owner_id: ownerId,
      viewer_id: viewerId,
    });
  } else {
    for (const albumId of [...new Set(access.albumIds)]) {
      rows.push({
        owner_id: ownerId,
        viewer_id: viewerId,
        scope: "album",
        album_id: albumId,
        photo_id: null,
      });
    }
    for (const photoId of [...new Set(access.photoIds)]) {
      rows.push({
        owner_id: ownerId,
        viewer_id: viewerId,
        scope: "photo",
        album_id: null,
        photo_id: photoId,
      });
    }
  }

  if (rows.length) {
    const { error: insertError } = await supabase.from("media_grants").insert(rows);
    if (insertError) {
      return {
        error:
          "Rode o SQL supabase/media-grants.sql no Supabase para liberar fotos.",
      };
    }
  }

  if (hasAnyAccess(access)) {
    await supabase
      .from("photo_requests")
      .update({ status: "accepted" })
      .eq("owner_id", ownerId)
      .eq("requester_id", viewerId)
      .eq("status", "pending");
  }

  const notice =
    options && "notice" in options
      ? options.notice ?? null
      : await noticeForAccess(access);
  if (!notice) return { error: null, notice: null, conversationId: null };

  const sent = await notifyAlbumGrant(
    viewerId,
    notice,
    options?.conversationId ?? null,
  );
  if (sent.error) {
    return { error: sent.error, notice, conversationId: sent.conversationId };
  }
  return { error: null, notice, conversationId: sent.conversationId };
}

export async function revokeAllAccess(
  supabase: Client,
  ownerId: string,
  viewerId: string,
  conversationId?: string | null,
) {
  return saveMediaAccess(supabase, ownerId, viewerId, EMPTY_ACCESS, {
    notice: "Acesso revogado",
    conversationId,
  });
}

function noticeForAccess(access: MediaAccess) {
  if (access.all) return "Fotos privadas liberadas";
  if (access.photoIds.length) return "Fotos liberadas";
  return "Acesso revogado";
}
