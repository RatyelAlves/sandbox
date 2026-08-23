import type { MediaAccess, Photo, Profile } from "@/lib/types";

export const EMPTY_ACCESS: MediaAccess = {
  all: false,
  photoIds: [],
  albumIds: [],
};

export function accessFromGrants(input: {
  all?: boolean;
  photoIds?: string[];
  albumIds?: string[];
}): MediaAccess {
  return {
    all: Boolean(input.all),
    photoIds: input.photoIds ?? [],
    albumIds: input.albumIds ?? [],
  };
}

export function accessFromGrantRows(
  legacyAll: boolean,
  rows: Array<{ scope: string; album_id?: string | null; photo_id?: string | null }>,
): MediaAccess {
  const all = legacyAll || rows.some((row) => row.scope === "all");
  if (all) return { all: true, photoIds: [], albumIds: [] };
  return {
    all: false,
    photoIds: rows
      .filter((row) => row.scope === "photo" && row.photo_id)
      .map((row) => row.photo_id as string),
    albumIds: rows
      .filter((row) => row.scope === "album" && row.album_id)
      .map((row) => row.album_id as string),
  };
}

export function hasAnyAccess(access: MediaAccess) {
  return access.all || access.photoIds.length > 0 || access.albumIds.length > 0;
}

export function accessSummary(access: MediaAccess) {
  if (access.all) return "Tudo privado";
  const bits: string[] = [];
  if (access.albumIds.length && !access.photoIds.length) {
    bits.push("Fotos");
  }
  if (access.photoIds.length) {
    bits.push(`${access.photoIds.length} foto${access.photoIds.length === 1 ? "" : "s"}`);
  }
  return bits.join(" · ");
}

export function isPhotoLocked(
  photo: Photo,
  owner: Profile,
  viewerId: string | null,
  access: MediaAccess | boolean,
) {
  const grant = typeof access === "boolean" ? accessFromGrants({ all: access }) : access;

  if (viewerId && viewerId === owner.id) return false;
  if (grant.all) return false;
  if (grant.photoIds.includes(photo.id)) return false;
  if (photo.album_id && grant.albumIds.includes(photo.album_id)) return false;
  if (photo.kind === "face" && owner.discreet_mode) return true;
  return photo.is_private;
}

export function profilePhotos(photos: Photo[], avatarPhotoId?: string | null) {
  const list = [...photos];
  if (!avatarPhotoId) return list;
  return list.sort(
    (a, b) => Number(b.id === avatarPhotoId) - Number(a.id === avatarPhotoId),
  );
}

function isPrivateLook(photo: Photo, owner: Profile) {
  return photo.is_private || (photo.kind === "face" && owner.discreet_mode);
}

export function profilePhotosPublicFirst(photos: Photo[], owner: Profile) {
  return photos.slice().sort((a, b) => comparePublicFirst(a, b, owner));
}

export function profileCarouselPhotos(
  photos: Photo[],
  owner: Profile,
  viewerId: string | null,
  access: MediaAccess,
) {
  const mine = Boolean(viewerId && viewerId === owner.id);
  return photos
    .filter((photo) => mine || !isPhotoLocked(photo, owner, viewerId, access))
    .slice()
    .sort((a, b) => comparePublicFirst(a, b, owner));
}

function comparePublicFirst(a: Photo, b: Photo, owner: Profile) {
  if (owner.avatar_photo_id) {
    const avatar =
      Number(b.id === owner.avatar_photo_id) - Number(a.id === owner.avatar_photo_id);
    if (avatar) return avatar;
  }
  const aPrivate = Number(isPrivateLook(a, owner));
  const bPrivate = Number(isPrivateLook(b, owner));
  if (aPrivate !== bPrivate) return aPrivate - bPrivate;
  return a.created_at.localeCompare(b.created_at);
}

export function publicThumbnail(photos: Photo[], owner: Profile) {
  const visible = profilePhotos(photos).filter((photo) => {
    if (photo.kind === "face" && owner.discreet_mode) return false;
    return !photo.is_private;
  });
  const chosen = owner.avatar_photo_id
    ? visible.find((photo) => photo.id === owner.avatar_photo_id)
    : null;
  return (
    chosen ??
    visible.find((photo) => photo.kind === "body") ??
    visible.find((photo) => photo.kind === "other") ??
    visible[0] ??
    null
  );
}

export function faceWouldBePrivate(owner: Pick<Profile, "discreet_mode">) {
  return owner.discreet_mode;
}
