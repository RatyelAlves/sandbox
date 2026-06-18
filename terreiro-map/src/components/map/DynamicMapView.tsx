"use client";

import dynamic from "next/dynamic";

export const DynamicMapView = dynamic(
  () => import("./MapView").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border-4 border-surface-card bg-input-surface-warm">
        <span className="text-sm text-text-brown/60">Carregando mapa...</span>
      </div>
    ),
  },
);
