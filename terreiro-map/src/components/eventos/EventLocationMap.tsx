"use client";

import { GeocodedMap } from "@/components/map/GeocodedMap";

interface EventLocationMapProps {
  local: string;
  title: string;
  fallbackLat?: number;
  fallbackLng?: number;
  className?: string;
  showUserLocation?: boolean;
}

export function EventLocationMap({
  local,
  title,
  fallbackLat,
  fallbackLng,
  className = "",
  showUserLocation = false,
}: EventLocationMapProps) {
  return (
    <GeocodedMap
      locations={[
        {
          id: "evento-local",
          address: local,
          title,
          description: local,
          fallbackLat,
          fallbackLng,
        },
      ]}
      height="280px"
      fill
      zoom={15}
      className="h-full min-h-[14rem] rounded-xl border-2 md:border-[3px]"
      wrapperClassName={`h-52 overflow-hidden rounded-xl sm:h-56 md:h-full md:min-h-[17rem] lg:min-h-[18rem] ${className}`}
      showUserLocation={showUserLocation}
      distanceLabel="deste evento"
    />
  );
}
