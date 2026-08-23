"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  IconBlock,
  IconGear,
  IconImage,
  IconPencil,
  IconUnlock,
} from "@/components/icons";
import { PublicProfileView } from "@/components/public-profile-view";
import { SettingsRow } from "@/components/settings-row";
import { createClient } from "@/lib/supabase/client";
import { profilePhotos } from "@/lib/photos";
import type { Photo, Profile } from "@/lib/types";

export default function ContaPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: row } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((row as Profile | null) ?? null);

    const [{ data: photoRows }, { data: requestRows }, { data: blockRows }] =
      await Promise.all([
        supabase.from("photos").select("*").eq("user_id", user.id).order("created_at"),
        supabase
          .from("photo_requests")
          .select("id")
          .eq("owner_id", user.id)
          .eq("status", "pending"),
        supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      ]);

    setPhotos((photoRows ?? []) as Photo[]);
    setPendingRequests((requestRows ?? []).length);
    setBlockedCount((blockRows ?? []).length);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!profile) {
    return <p className="px-4 py-6 text-[13px] text-muted">Carregando…</p>;
  }

  return (
    <div className="pb-4">
      <PublicProfileView
        profile={profile}
        photos={photos}
        viewerId={profile.id}
        action={
          <Link
            href="/conta/editar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink"
            aria-label="Editar perfil"
          >
            <IconPencil className="h-5 w-5" />
          </Link>
        }
        footer={
          <nav className="divide-y divide-line border-y border-line lg:rounded-xl lg:border lg:border-line">
            <SettingsRow
              href="/conta/fotos"
              label="Adicionar fotos"
              value={`${profilePhotos(photos).length}/6`}
              icon={<IconImage className="h-4 w-4" />}
            />
            <SettingsRow
              href="/conta/liberar"
              label="Liberar fotos"
              icon={<IconUnlock className="h-4 w-4" />}
            />
            <SettingsRow
              href="/conta/bloqueados"
              label="Bloqueados"
              value={blockedCount ? String(blockedCount) : undefined}
              icon={<IconBlock className="h-4 w-4" />}
            />
            <SettingsRow
              href="/conta/ajustes"
              label="Ajustes"
              badge={pendingRequests || undefined}
              icon={<IconGear className="h-4 w-4" />}
            />
          </nav>
        }
      />
    </div>
  );
}
