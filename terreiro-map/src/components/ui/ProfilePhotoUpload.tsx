"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

interface ProfilePhotoUploadProps {
  label?: string;
}

export function ProfilePhotoUpload({
  label = "Adicionar foto de perfil",
}: ProfilePhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="mx-auto mb-2 flex flex-col items-center">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleChange}
        aria-label={label}
      />
      <button
        type="button"
        onClick={openPicker}
        className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--input-border)] bg-input-surface-warm transition-opacity hover:opacity-90 md:h-20 md:w-20"
        aria-label={label}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Pré-visualização da foto de perfil"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-4xl text-text-brown md:text-3xl">+</span>
        )}
      </button>
      <label
        htmlFor={inputId}
        className="mt-2 cursor-pointer text-xs font-medium text-text-brown/55 hover:text-text-brown"
      >
        {preview ? "Alterar foto" : "Toque para adicionar foto"}
      </label>
    </div>
  );
}
