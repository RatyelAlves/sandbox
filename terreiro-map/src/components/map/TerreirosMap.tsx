"use client";

import { useMemo } from "react";
import { GeocodedMap } from "@/components/map/GeocodedMap";
import type { Terreiro } from "@/lib/mock-data";
import { terreiroToGeocodedLocation } from "@/lib/terreiro-utils";

interface TerreirosMapProps {
  terreiros: Terreiro[];
  zoom?: number;
  height?: string;
  fill?: boolean;
  className?: string;
  wrapperClassName?: string;
  loadingMessage?: string;
  showUserLocation?: boolean;
  distanceLabel?: string;
  markerHrefPrefix?: string;
}

export function TerreirosMap({
  terreiros,
  zoom,
  height = "280px",
  fill = false,
  className = "",
  wrapperClassName = "",
  loadingMessage,
  showUserLocation = false,
  distanceLabel = "deste terreiro",
  markerHrefPrefix,
}: TerreirosMapProps) {
  const locations = useMemo(
    () =>
      terreiros.map((terreiro) => ({
        ...terreiroToGeocodedLocation(terreiro),
        href: markerHrefPrefix
          ? `${markerHrefPrefix}/${terreiro.id}`
          : undefined,
      })),
    [terreiros, markerHrefPrefix],
  );

  return (
    <GeocodedMap
      locations={locations}
      zoom={zoom}
      height={height}
      fill={fill}
      className={className}
      wrapperClassName={wrapperClassName}
      loadingMessage={
        loadingMessage ??
        (terreiros.length === 1
          ? "Localizando endereço..."
          : "Localizando endereços...")
      }
      emptyMessage="Não foi possível localizar os endereços no mapa."
      showUserLocation={showUserLocation}
      distanceLabel={distanceLabel}
    />
  );
}
