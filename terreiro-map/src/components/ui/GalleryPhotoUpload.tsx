"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

interface GalleryPhotoUploadProps {
  value: (string | null)[];
  onChange: (photos: (string | null)[]) => void;
  maxPhotos?: number;
}

function createEmptySlots(maxPhotos: number): (string | null)[] {
  return Array.from({ length: maxPhotos }, () => null);
}

export function createGallerySlots(
  photos: string[] = [],
  maxPhotos = 3,
): (string | null)[] {
  const slots = createEmptySlots(maxPhotos);
  photos.slice(0, maxPhotos).forEach((photo, index) => {
    slots[index] = photo;
  });
  return slots;
}

export function gallerySlotsToPhotos(slots: (string | null)[]): string[] {
  return slots.filter((photo): photo is string => Boolean(photo));
}

export function GalleryPhotoUpload({
  value,
  onChange,
  maxPhotos = 3,
}: GalleryPhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const slots =
    value.length === maxPhotos ? value : createGallerySlots(gallerySlotsToPhotos(value), maxPhotos);

  const openPicker = (index: number) => {
    setActiveSlot(index);
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || activeSlot === null) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;

      const next = [...slots];
      next[activeSlot] = reader.result;
      onChange(next);
      setActiveSlot(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (index: number) => {
    const next = [...slots];
    next[index] = null;
    onChange(next);
  };

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      {slots.map((photo, index) => (
        <div key={index} className="relative">
          {photo ? (
            <>
              <button
                type="button"
                onClick={() => openPicker(index)}
                className="relative flex h-20 w-20 overflow-hidden rounded-xl bg-input-surface-warm ring-1 ring-[color:var(--input-border)] transition-colors hover:ring-input-orange/45"
                aria-label={`Alterar foto ${index + 1}`}
              >
                <Image
                  src={photo}
                  alt={`Foto ${index + 1} do terreiro`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-input-orange text-xs font-bold text-white shadow-sm ring-2 ring-white transition-transform hover:scale-105 active:scale-95"
                aria-label={`Remover foto ${index + 1}`}
              >
                ×
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => openPicker(index)}
              className="flex h-20 w-20 items-center justify-center rounded-xl bg-input-surface-warm ring-1 ring-[color:var(--input-border)] transition-colors hover:bg-surface-elevated hover:ring-input-orange/35"
              aria-label={`Adicionar foto ${index + 1}`}
            >
              <Image src="/assets/add-image.png" alt="" width={32} height={32} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
