"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignedImage } from "@/components/signed-image";

export type LightboxSlide = {
  id: string;
  path: string;
};

export function PhotoLightbox({
  slides,
  alias,
  startIndex,
  onClose,
}: {
  slides: LightboxSlide[];
  alias: string;
  startIndex: number;
  onClose: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);

  function scrollTo(next: number, smooth = true) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    setIndex(clamped);
  }

  useLayoutEffect(() => {
    scrollTo(startIndex, false);
  }, [startIndex]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") scrollTo(index - 1);
      if (event.key === "ArrowRight") scrollTo(index + 1);
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold"
      >
        Fechar
      </button>
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-dvh w-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <div key={slide.id} className="relative h-dvh w-full shrink-0 snap-center bg-black">
            <SignedImage
              path={slide.path}
              alt={`Foto de ${alias}`}
              className="h-full w-full object-contain bg-black"
            />
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold">
          {index + 1}/{slides.length}
        </p>
      ) : null}
    </div>,
    document.body,
  );
}
