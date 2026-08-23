import Link from "next/link";
import { SignedImage } from "@/components/signed-image";
import { Silhouette } from "@/components/silhouette";
import { publicThumbnail } from "@/lib/photos";
import type { Photo, Profile } from "@/lib/types";

export function ProfileCard({
  profile,
  photos,
}: {
  profile: Profile;
  photos: Photo[];
}) {
  const thumb = publicThumbnail(photos, profile);
  const cityShort = profile.city.split(",")[0];

  return (
    <Link
      href={`/u/${profile.id}`}
      className="group relative block aspect-square overflow-hidden bg-bg-elevated active:scale-[0.97]"
    >
      {thumb ? (
        <SignedImage
          path={thumb.path}
          alt={`Foto de ${profile.alias}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <Silhouette alias={profile.alias} className="h-full w-full" />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-2">
        <p className="truncate text-[15px] font-bold leading-tight text-white">
          {profile.alias}
        </p>
        <p className="truncate text-[12px] font-bold tracking-wide text-white">
          {profile.age} · {cityShort}
        </p>
      </div>
    </Link>
  );
}
