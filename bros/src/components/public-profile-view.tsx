import { IconDiscreet } from "@/components/icons";
import { PhotoCarousel } from "@/components/photo-carousel";
import { lookingForLabel, profileStats } from "@/lib/labels";
import {
  EMPTY_ACCESS,
  isPhotoLocked,
  profileCarouselPhotos,
} from "@/lib/photos";
import type { MediaAccess, Photo, Profile } from "@/lib/types";

export function PublicProfileView({
  profile,
  photos,
  viewerId,
  access = EMPTY_ACCESS,
  action,
  footer,
}: {
  profile: Profile;
  photos: Photo[];
  viewerId: string | null;
  access?: MediaAccess;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const grid = profileCarouselPhotos(photos, profile, viewerId, access);
  const stats = profileStats(profile);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-5 lg:pt-6">
      <div className="lg:overflow-hidden lg:rounded-2xl">
        <PhotoCarousel
          alias={profile.alias}
          slides={grid.map((photo) => ({
            id: photo.id,
            path: photo.path,
            locked: isPhotoLocked(photo, profile, viewerId, access),
          }))}
        />
      </div>

      <div className="space-y-4 px-4 pt-5 lg:px-0 lg:pt-1">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[26px] font-bold leading-none tracking-tight">
              {profile.alias}, {profile.age}
              {profile.discreet_mode ? (
                <span
                  title="Modo discreto"
                  aria-label="Modo discreto"
                  className="ml-1.5 inline-flex h-[0.78em] w-[0.78em] -translate-y-[0.08em] items-center justify-center rounded-full bg-accent align-middle text-accent-ink"
                >
                  <IconDiscreet className="h-[0.52em] w-[0.52em]" />
                </span>
              ) : null}
            </h1>
            {action}
          </div>
          <p className="mt-1.5 text-[13px] text-muted">
            {profile.city} · {lookingForLabel(profile.looking_for)}
          </p>
          {stats.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stats.map((stat) => (
                <span
                  key={stat}
                  className="rounded-full bg-bg-elevated px-2.5 py-1 text-[12px] font-bold"
                >
                  {stat}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Sobre
          </p>
          {profile.bio ? (
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">
              {profile.bio}
            </p>
          ) : (
            <p className="mt-2 text-[15px] text-muted">Sem descrição.</p>
          )}
        </section>

        {footer}
      </div>
    </div>
  );
}
