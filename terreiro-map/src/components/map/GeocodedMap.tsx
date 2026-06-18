"use client";

import { useEffect, useMemo, useState } from "react";
import { DynamicMapView } from "@/components/map/DynamicMapView";
import type { MapMarker } from "@/components/map/MapView";
import { useUserLocation } from "@/hooks/useUserLocation";
import {
  distanceBetweenPoints,
  formatDistanceKm,
} from "@/lib/distance-utils";
import {
  resolveGeocodedMarkers,
  type GeocodedLocationInput,
} from "@/lib/geocode";

interface GeocodedMapProps {
  locations: GeocodedLocationInput[];
  zoom?: number;
  height?: string;
  fill?: boolean;
  className?: string;
  wrapperClassName?: string;
  loadingMessage?: string;
  emptyMessage?: string;
  showUserLocation?: boolean;
  distanceLabel?: string;
}

export function GeocodedMap({
  locations,
  zoom,
  height = "280px",
  fill = false,
  className = "",
  wrapperClassName = "",
  loadingMessage = "Localizando endereço...",
  emptyMessage = "Não foi possível localizar este endereço no mapa.",
  showUserLocation = false,
  distanceLabel = "deste local",
}: GeocodedMapProps) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const { location: userLocation, status: userLocationStatus } =
    useUserLocation(showUserLocation);

  const locationsKey = useMemo(
    () =>
      locations
        .map(
          (location) =>
            `${location.id}|${location.address}|${location.fallbackLat ?? ""}|${location.fallbackLng ?? ""}`,
        )
        .join(";;"),
    [locations],
  );

  const mapZoom = zoom ?? (locations.length === 1 ? 15 : 11);

  const containerClassName = [
    fill ? "h-full w-full min-h-0" : "",
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const stateClassName = [
    containerClassName,
    !wrapperClassName && fill
      ? "flex items-center justify-center rounded-2xl border-4 border-surface-card bg-input-surface-warm"
      : !wrapperClassName
        ? "flex items-center justify-center rounded-2xl border-4 border-surface-card bg-input-surface-warm"
        : "flex items-center justify-center bg-input-surface-warm",
  ]
    .filter(Boolean)
    .join(" ");

  const mapClassName = [fill ? "h-full min-h-0" : "", className]
    .filter(Boolean)
    .join(" ");

  const distanceKm = useMemo(() => {
    if (!showUserLocation || !userLocation || markers.length !== 1) return null;
    return distanceBetweenPoints(userLocation, markers[0]);
  }, [showUserLocation, userLocation, markers]);

  const distanceMessage = useMemo(() => {
    if (!showUserLocation) return null;

    if (userLocationStatus === "loading" || userLocationStatus === "idle") {
      return "Obtendo sua localização...";
    }

    if (userLocationStatus === "denied") {
      return "Permita o acesso à localização para ver a distância.";
    }

    if (userLocationStatus === "unsupported") {
      return "Seu navegador não suporta geolocalização.";
    }

    if (distanceKm === null) {
      return null;
    }

    return `Você está a ${formatDistanceKm(distanceKm)} ${distanceLabel}`;
  }, [showUserLocation, userLocationStatus, distanceKm, distanceLabel]);

  useEffect(() => {
    let cancelled = false;

    async function resolveLocations() {
      setLoading(true);

      if (locations.length === 0) {
        if (!cancelled) {
          setMarkers([]);
          setLoading(false);
        }
        return;
      }

      const resolved = await resolveGeocodedMarkers(locations);
      if (cancelled) return;

      setMarkers(resolved);
      setLoading(false);
    }

    resolveLocations();

    return () => {
      cancelled = true;
    };
  }, [locations, locationsKey]);

  const loadingClass =
    stateClassName ||
    (fill
      ? "flex h-full min-h-0 w-full items-center justify-center rounded-2xl border-4 border-surface-card bg-input-surface-warm"
      : "flex items-center justify-center rounded-2xl border-4 border-surface-card bg-input-surface-warm");

  if (loading) {
    return (
      <div
        className={loadingClass}
        style={fill ? undefined : { height }}
      >
        <span className="text-sm text-text-brown/60">{loadingMessage}</span>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div
        className={`${loadingClass} px-4 text-center`}
        style={fill ? undefined : { height }}
      >
        <span className="text-sm text-text-brown/60">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div
      className={[
        containerClassName || (fill ? "h-full w-full min-h-0" : undefined),
        fill && distanceMessage ? "relative" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <DynamicMapView
        markers={markers}
        userLocation={showUserLocation ? userLocation : null}
        height={height}
        fill={fill}
        zoom={mapZoom}
        className={mapClassName}
      />
      {distanceMessage && (
        <p
          className={
            fill
              ? "pointer-events-none absolute bottom-10 left-1/2 z-[1000] max-w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-full bg-cream/95 px-3 py-1 text-center text-[11px] leading-snug text-text-brown/75 shadow-sm ring-1 ring-text-brown/10"
              : "mt-2 text-center text-xs leading-snug text-text-brown/70"
          }
        >
          {distanceKm !== null ? (
            <>
              Você está a{" "}
              <span className="font-semibold text-input-orange">
                {formatDistanceKm(distanceKm)}
              </span>{" "}
              {distanceLabel}
            </>
          ) : (
            distanceMessage
          )}
        </p>
      )}
    </div>
  );
}
