"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import {
  EMPTY_FAVORITE_TERREIRO_IDS,
  getFavoriteTerreiroIdsSnapshot,
  subscribeToFavoritos,
  toggleFavoriteTerreiro,
} from "@/lib/favoritos-store";

interface FavoriteTerreiroButtonProps {
  terreiroId: string;
}

export function FavoriteTerreiroButton({ terreiroId }: FavoriteTerreiroButtonProps) {
  const favoriteIds = useSyncExternalStore(
    subscribeToFavoritos,
    getFavoriteTerreiroIdsSnapshot,
    () => EMPTY_FAVORITE_TERREIRO_IDS,
  );
  const isFavorite = favoriteIds.includes(terreiroId);

  return (
    <button
      type="button"
      onClick={() => toggleFavoriteTerreiro(terreiroId)}
      aria-label={
        isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
      }
      aria-pressed={isFavorite}
      className={`flex h-10 w-10 items-center justify-center justify-self-end rounded-full transition-all active:scale-95 ${
        isFavorite
          ? "bg-input-orange/15 ring-1 ring-input-orange/40"
          : "hover:bg-input-orange/10"
      }`}
    >
      <Image
        src="/assets/star.png"
        alt=""
        width={24}
        height={24}
        className={isFavorite ? "" : "opacity-70"}
        style={
          isFavorite
            ? {
                filter:
                  "invert(48%) sepia(79%) saturate(600%) hue-rotate(346deg) brightness(95%) contrast(92%)",
              }
            : undefined
        }
      />
    </button>
  );
}
