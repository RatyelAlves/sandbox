"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignedImage } from "@/components/signed-image";
import { Silhouette } from "@/components/silhouette";

export type CarouselSlide = {
  id: string;
  path: string;
  locked: boolean;
};

function SlideImage({
  slide,
  alias,
}: {
  slide: CarouselSlide;
  alias: string;
}) {
  if (slide.locked) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-black text-center">
        <p className="text-[12px] font-bold uppercase tracking-wide text-muted">
          Privado
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <SignedImage
        path={slide.path}
        alt={`Foto de ${alias}`}
        className="h-full w-full object-contain bg-black"
      />
    </div>
  );
}

export function PhotoCarousel({
  slides,
  alias,
}: {
  slides: CarouselSlide[];
  alias: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef(0);
  const dragged = useRef(false);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  indexRef.current = index;

  function scrollToIndex(el: HTMLDivElement | null, next: number, smooth = true) {
    if (!el) return;
    const clamped = Math.max(0, Math.min(slides.length - 1, next));
    el.scrollTo({
      left: clamped * el.clientWidth,
      behavior: smooth ? "smooth" : "auto",
    });
    setIndex(clamped);
  }

  function onScroll(el: HTMLDivElement | null) {
    if (!el?.clientWidth) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function onPointerDown(event: React.PointerEvent) {
    pointerStart.current = event.clientX;
    dragged.current = false;
  }

  function onPointerMove(event: React.PointerEvent) {
    if (Math.abs(event.clientX - pointerStart.current) > 10) {
      dragged.current = true;
    }
  }

  function onTap() {
    if (dragged.current) return;
    const slide = slides[index];
    if (!slide || slide.locked) return;
    setOpen(true);
  }

  useLayoutEffect(() => {
    if (!open) return;
    scrollToIndex(fullRef.current, indexRef.current, false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft") {
        scrollToIndex(fullRef.current, indexRef.current - 1);
      }
      if (event.key === "ArrowRight") {
        scrollToIndex(fullRef.current, indexRef.current + 1);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (slides.length === 0) {
    return <Silhouette alias={alias} className="aspect-[4/5] w-full" />;
  }

  const lightbox =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[100] bg-black">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold"
            >
              Fechar
            </button>
            <div
              ref={fullRef}
              onScroll={() => onScroll(fullRef.current)}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              className="no-scrollbar flex h-dvh w-full snap-x snap-mandatory overflow-x-auto"
            >
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className="h-dvh w-full shrink-0 snap-center bg-black"
                >
                  <SlideImage slide={slide} alias={alias} />
                </div>
              ))}
            </div>
            {slides.length > 1 ? (
              <>
                <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
                  {slides.map((slide, i) => (
                    <span
                      key={slide.id}
                      className={`h-0.5 flex-1 rounded-full ${
                        i === index ? "bg-accent" : "bg-white/35"
                      }`}
                    />
                  ))}
                </div>
                <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-bold">
                  {index + 1}/{slides.length}
                </p>
              </>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div
          ref={scrollerRef}
          onScroll={() => onScroll(scrollerRef.current)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onClick={onTap}
          className="no-scrollbar flex aspect-[4/5] cursor-zoom-in snap-x snap-mandatory overflow-x-auto"
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative h-full w-full shrink-0 snap-center overflow-hidden bg-black"
            >
              <SlideImage slide={slide} alias={alias} />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
          {slides.map((slide, i) => (
            <span
              key={slide.id}
              className={`h-0.5 flex-1 rounded-full ${
                i === index ? "bg-accent" : "bg-white/35"
              }`}
            />
          ))}
        </div>
      ) : null}

      {lightbox}
    </div>
  );
}
