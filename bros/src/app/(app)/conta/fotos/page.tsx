"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackBar } from "@/components/back-bar";
import { PhotoCropper } from "@/components/photo-cropper";
import { IconMore } from "@/components/icons";
import { PhotoPrivacyBadge } from "@/components/photo-privacy-button";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { SignedImage } from "@/components/signed-image";
import { Alert, buttonClass } from "@/components/ui";
import { PHOTO_KIND_OPTIONS } from "@/lib/labels";
import { profilePhotos } from "@/lib/photos";
import { createClient } from "@/lib/supabase/client";
import type { Photo, PhotoKind, Profile } from "@/lib/types";
import { uploadPhotoFile } from "@/lib/upload-photo";

const MAX_PHOTOS = 6;

export default function FotosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [kind, setKind] = useState<PhotoKind>("body");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

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
    const { data: photoRows } = await supabase
      .from("photos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    setPhotos(
      profilePhotos(
        (photoRows ?? []) as Photo[],
        (row as Profile | null)?.avatar_photo_id,
      ),
    );
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;
    if (photos.length >= MAX_PHOTOS) {
      setError(`No máximo ${MAX_PHOTOS} fotos no perfil.`);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use JPG, PNG ou WebP.");
      return;
    }
    setError("");
    setPendingFile(file);
  }

  async function onCropped(file: File) {
    if (!profile) return;
    setPendingFile(null);
    setBusy(true);
    setError("");
    const locked = kind === "face" && profile.discreet_mode ? true : isPrivate;
    const result = await uploadPhotoFile({
      userId: profile.id,
      file,
      kind,
      isPrivate: locked,
    });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!profile.avatar_photo_id && result.id && !isPrivate && kind !== "face") {
      await createClient()
        .from("profiles")
        .update({ avatar_photo_id: result.id })
        .eq("id", profile.id);
    }
    await load();
  }

  async function setAvatar(photo: Photo) {
    if (!profile) return;
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_photo_id: photo.id })
      .eq("id", profile.id);
    if (updateError) {
      setError("Rode o SQL supabase/avatar-photo.sql no Supabase.");
      return;
    }
    await load();
  }

  async function togglePrivacy(photo: Photo) {
    if (!profile) return;
    if (photo.kind === "face" && profile.discreet_mode) {
      setError("No modo discreto, foto de rosto não pode ficar pública.");
      return;
    }
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("photos")
      .update({ is_private: !photo.is_private })
      .eq("id", photo.id);
    if (updateError) {
      setError("Não foi possível mudar a privacidade.");
      return;
    }
    await load();
  }

  async function removePhoto(photo: Photo) {
    const supabase = createClient();
    await supabase.storage.from("photos").remove([photo.path]);
    await supabase.from("photos").delete().eq("id", photo.id);
    await load();
  }

  return (
    <div>
      <BackBar href="/conta" title="Fotos" />
      <p className="mb-4 text-[13px] text-muted">
        Até {MAX_PHOTOS} fotos. Corpo, Rosto ou Outra classifica a próxima foto
        que você adicionar. Toque nos três pontos para as outras opções.
        {profile?.discreet_mode
          ? " No modo discreto, foto de rosto fica privada e só aparece para quem você Liberar."
          : ""}
      </p>
      {error ? <Alert>{error}</Alert> : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={kind}
          onChange={(event) => setKind(event.target.value as PhotoKind)}
          className="rounded-full border border-line bg-bg-elevated px-3 py-2 text-[13px] font-bold"
        >
          {PHOTO_KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={kind === "face" && profile?.discreet_mode ? true : isPrivate}
            disabled={kind === "face" && Boolean(profile?.discreet_mode)}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="accent-accent"
          />
          {kind === "face" && profile?.discreet_mode
            ? "Privada (rosto no modo discreto)"
            : "Privada"}
        </label>
        <label className={buttonClass.primary}>
          {busy ? "Enviando…" : "Adicionar foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={onPick}
          />
        </label>
      </div>

      {menuId ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMenuId(null)}
          className="fixed inset-0 z-20 bg-transparent"
        />
      ) : null}

      <div className="grid grid-cols-2 gap-1">
        {photos.map((photo, index) => {
          const isAvatar = profile?.avatar_photo_id === photo.id;
          const faceLocked = photo.kind === "face" && Boolean(profile?.discreet_mode);
          const open = menuId === photo.id;
          return (
            <figure key={photo.id} className="relative aspect-square bg-bg-elevated">
              <button
                type="button"
                onClick={() => setViewIndex(index)}
                className="absolute inset-0"
                aria-label="Ver em tela cheia"
              >
                <SignedImage
                  path={photo.path}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1">
                <PhotoPrivacyBadge isPrivate={photo.is_private} />
                {isAvatar ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">
                    Perfil
                  </span>
                ) : null}
              </div>
              <div className="absolute right-2 top-2 z-30">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuId(open ? null : photo.id);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                  aria-expanded={open}
                  aria-label="Opções da foto"
                >
                  <IconMore className="h-4 w-4" />
                </button>
                {open ? (
                  <div className="absolute right-0 top-10 z-40 min-w-[11rem] overflow-hidden rounded-2xl bg-bg-elevated py-1 shadow-lg ring-1 ring-line">
                    {isAvatar ? null : (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          void setAvatar(photo);
                        }}
                        className="block w-full px-3 py-2.5 text-left text-[13px] font-bold"
                      >
                        Usar no perfil
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={faceLocked}
                      onClick={() => {
                        setMenuId(null);
                        void togglePrivacy(photo);
                      }}
                      className="block w-full px-3 py-2.5 text-left text-[13px] font-bold disabled:opacity-40"
                    >
                      {photo.is_private ? "Tornar pública" : "Tornar privada"}
                    </button>
                    <Link
                      href={`/conta/liberar?photo=${photo.id}`}
                      onClick={() => setMenuId(null)}
                      className="block w-full px-3 py-2.5 text-left text-[13px] font-bold"
                    >
                      Liberar
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuId(null);
                        void removePhoto(photo);
                      }}
                      className="block w-full px-3 py-2.5 text-left text-[13px] font-bold text-danger"
                    >
                      Apagar
                    </button>
                  </div>
                ) : null}
              </div>
            </figure>
          );
        })}
      </div>

      {viewIndex != null && profile ? (
        <PhotoLightbox
          slides={photos.map((photo) => ({ id: photo.id, path: photo.path }))}
          alias={profile.alias}
          startIndex={viewIndex}
          onClose={() => setViewIndex(null)}
        />
      ) : null}

      {pendingFile ? (
        <PhotoCropper
          file={pendingFile}
          isPrivate={kind === "face" && profile?.discreet_mode ? true : isPrivate}
          onPrivateChange={(value) => {
            if (kind === "face" && profile?.discreet_mode) return;
            setIsPrivate(value);
          }}
          onCancel={() => setPendingFile(null)}
          onConfirm={onCropped}
        />
      ) : null}
    </div>
  );
}
