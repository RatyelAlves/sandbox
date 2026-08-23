"use client";

import { useEffect, useMemo, useState } from "react";
import { ProfileCard } from "@/components/profile-card";
import { loadBlockedIds } from "@/lib/blocks";
import { CITIES } from "@/lib/cities";
import { createClient } from "@/lib/supabase/client";
import type { Photo, Profile } from "@/lib/types";

export default function DescobrirPage() {
  const [me, setMe] = useState<Profile | null>(null);
  const [city, setCity] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile) {
        setMe(profile as Profile);
        setCity((profile as Profile).city);
      }
    });
  }, []);

  useEffect(() => {
    if (!me || !city) return;
    let cancelled = false;
    setLoading(true);
    const supabase = createClient();

    (async () => {
      const { data: rows } = await supabase
        .from("profiles")
        .select("*")
        .eq("city", city)
        .neq("id", me.id)
        .order("updated_at", { ascending: false })
        .limit(60);

      const blockedIds = await loadBlockedIds(me.id);
      const list = ((rows ?? []) as Profile[]).filter((row) => !blockedIds.has(row.id));
      const ids = list.map((row) => row.id);
      let nextPhotos: Photo[] = [];
      if (ids.length) {
        const { data: photoRows } = await supabase
          .from("photos")
          .select("*")
          .in("user_id", ids);
        nextPhotos = (photoRows ?? []) as Photo[];
      }

      if (!cancelled) {
        setProfiles(list);
        setPhotos(nextPhotos);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me, city]);

  const photosByUser = useMemo(() => {
    const map = new Map<string, Photo[]>();
    for (const photo of photos) {
      const list = map.get(photo.user_id) ?? [];
      list.push(photo);
      map.set(photo.user_id, list);
    }
    return map;
  }, [photos]);

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2 sm:px-5">
        <input
          list="discover-cities"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-8 flex-1 bg-transparent text-[15px] font-bold text-ink outline-none"
          placeholder="Cidade"
        />
        <datalist id="discover-cities">
          {CITIES.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </div>

      {loading ? (
        <p className="p-4 text-[13px] text-muted">Carregando…</p>
      ) : profiles.length === 0 ? (
        <p className="p-6 text-[13px] text-muted">
          Ninguém por aqui ainda. Crie outro perfil de teste nessa cidade.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              photos={photosByUser.get(profile.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
