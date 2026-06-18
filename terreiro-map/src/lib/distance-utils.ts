import { haversineKm } from "@/lib/sort-utils";

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`;
  }

  return `${km.toFixed(1).replace(".", ",")} km`;
}

export function distanceBetweenPoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  return haversineKm(from.lat, from.lng, to.lat, to.lng);
}
