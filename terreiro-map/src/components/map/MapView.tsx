"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { GeocodeResult } from "@/lib/geocode";
import type { Terreiro } from "@/lib/mock-data";

const defaultCenter: [number, number] = [-19.9167, -43.9345];

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  href?: string;
}

function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [map]);

  return null;
}

function MapViewportFix({ points }: { points: [number, number][] }) {
  const map = useMap();
  const pointsKey = points.map((point) => point.join(",")).join("|");

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], map.getZoom());
      return;
    }

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [map, points, pointsKey]);

  return null;
}

const terreiroIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const eventIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#ec4899;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">♥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const locationIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#df853a;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userLocationIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background:#2563eb;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface MapViewProps {
  terreiros?: Terreiro[];
  markers?: MapMarker[];
  userLocation?: GeocodeResult | null;
  height?: string;
  showEvents?: boolean;
  zoom?: number;
  className?: string;
  fill?: boolean;
}

export function MapView({
  terreiros = [],
  markers = [],
  userLocation = null,
  height = "280px",
  showEvents = true,
  zoom = 10,
  className = "",
  fill = false,
}: MapViewProps) {
  const router = useRouter();
  const containerStyle = fill ? { minHeight: height } : { height };
  const mapPoints = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [];

    if (markers.length > 0) {
      points.push(...markers.map((marker) => [marker.lat, marker.lng] as [number, number]));
    } else {
      points.push(
        ...terreiros.map(
          (terreiro) => [terreiro.lat, terreiro.lng] as [number, number],
        ),
      );
    }

    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    return points;
  }, [markers, terreiros, userLocation]);

  const initialCenter = mapPoints[0] ?? defaultCenter;

  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] border-[3px] border-white shadow-[0_2px_16px_rgba(62,52,46,0.12)] md:rounded-2xl md:border-4 ${fill ? "h-full min-h-0 flex-1" : ""} ${className}`}
      style={containerStyle}
    >
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: fill ? height : undefined }}
      >
        <MapResizeFix />
        <MapViewportFix points={mapPoints} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <strong>Você está aqui</strong>
            </Popup>
          </Marker>
        )}
        {markers.length > 0
          ? markers.map((marker) => (
              <Marker
                key={marker.id}
                position={[marker.lat, marker.lng]}
                icon={locationIcon}
              >
                <Popup>
                  <strong>{marker.title}</strong>
                  {marker.description && (
                    <>
                      <br />
                      {marker.description}
                    </>
                  )}
                  {marker.href && (
                    <>
                      <br />
                      <button
                        type="button"
                        onClick={() => router.push(marker.href!)}
                        className="mt-1 text-sm font-semibold text-input-orange hover:underline"
                      >
                        Ver perfil
                      </button>
                    </>
                  )}
                </Popup>
              </Marker>
            ))
          : terreiros.map((t) => (
              <Marker
                key={t.id}
                position={[t.lat, t.lng]}
                icon={showEvents && t.id === "1" ? terreiroIcon : eventIcon}
              >
                <Popup>
                  <strong>{t.nome}</strong>
                  <br />
                  {t.cidade}, {t.uf}
                </Popup>
              </Marker>
            ))}
      </MapContainer>
    </div>
  );
}
