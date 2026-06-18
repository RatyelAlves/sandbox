export interface GeocodeResult {
  lat: number;
  lng: number;
}

export interface GeocodedLocationInput {
  id: string;
  address: string;
  title: string;
  description?: string;
  fallbackLat?: number;
  fallbackLng?: number;
  href?: string;
}

export interface ResolvedMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  href?: string;
}

const cache = new Map<string, GeocodeResult | null>();

function resolveCoords(location: GeocodedLocationInput): Promise<ResolvedMapMarker | null> {
  return geocodeAddress(location.address).then((geocoded) => {
    const coords =
      geocoded ??
      (location.fallbackLat !== undefined && location.fallbackLng !== undefined
        ? { lat: location.fallbackLat, lng: location.fallbackLng }
        : null);

    if (!coords) return null;

    return {
      id: location.id,
      lat: coords.lat,
      lng: coords.lng,
      title: location.title,
      description: location.description ?? location.address,
      href: location.href,
    };
  });
}

export async function resolveGeocodedMarkers(
  locations: GeocodedLocationInput[],
): Promise<ResolvedMapMarker[]> {
  const results = await Promise.all(locations.map(resolveCoords));
  return results.filter((marker): marker is ResolvedMapMarker => Boolean(marker));
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) return null;

  const key = query.toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${query}, Brasil`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "Accept-Language": "pt-BR",
      },
    });

    if (!response.ok) {
      cache.set(key, null);
      return null;
    }

    const data = (await response.json()) as Array<{ lat: string; lon: string }>;
    const match = data[0];

    if (!match) {
      cache.set(key, null);
      return null;
    }

    const result = {
      lat: Number.parseFloat(match.lat),
      lng: Number.parseFloat(match.lon),
    };

    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, null);
    return null;
  }
}
