"use client";

import { createGallerySlots } from "@/components/ui/GalleryPhotoUpload";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

interface TerreiroPhotoCarouselProps {
  fotos: string[];
  alt: string;
  /** compact = menos altura (ex.: acesso terreiro com banner extra) */
  density?: "comfortable" | "compact";
}

const MAX_SLIDES = 3;

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

const heightByDensity = {
  comfortable: "h-56 sm:h-64 md:h-72",
  compact: "h-52 sm:h-60 md:h-64",
} as const;

export function TerreiroPhotoCarousel({
  fotos,
  alt,
  density = "comfortable",
}: TerreiroPhotoCarouselProps) {
  const slides = createGallerySlots(fotos, MAX_SLIDES);
  const slideCount = slides.length;

  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const trackHeight = heightByDensity[density];

  const scrollToIndex = useCallback((next: number) => {
    const normalized = (next + slideCount) % slideCount;
    slideRefs.current[normalized]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
    setIndex(normalized);
  }, [slideCount]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.55) continue;
          const slideIndex = Number(
            (entry.target as HTMLElement).dataset.index ?? NaN,
          );
          if (!Number.isNaN(slideIndex)) {
            setIndex(slideIndex);
          }
        }
      },
      { root, threshold: [0.55, 0.75] },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, [slides]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(index + 1);
    }
  };

  return (
    <div
      className="my-4 shrink-0 py-4"
      role="region"
      aria-roledescription="carrossel"
      aria-label={`Fotos de ${alt}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="group relative">
        <div
          ref={scrollRef}
          className={`flex ${trackHeight} snap-x snap-mandatory snap-center gap-2 overflow-x-auto scroll-smooth px-[6%] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {slides.map((foto, i) => (
            <div
              key={foto ? `${foto}-${i}` : `empty-${i}`}
              ref={(node) => {
                slideRefs.current[i] = node;
              }}
              data-index={i}
              className="relative aspect-[3/4] h-full shrink-0 snap-center snap-always overflow-hidden rounded-xl bg-neutral-200"
            >
              {foto ? (
                <Image
                  src={foto}
                  alt={`${alt} — foto ${i + 1}`}
                  fill
                  priority={i === 0}
                  className="object-contain"
                  sizes="(max-width: 768px) 40vw, 280px"
                  draggable={false}
                />
              ) : null}
            </div>
          ))}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/45 to-transparent"
        />

        <button
          type="button"
          onClick={() => scrollToIndex(index - 1)}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text-brown shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition hover:bg-white active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <ChevronIcon direction="left" />
        </button>

        <button
          type="button"
          onClick={() => scrollToIndex(index + 1)}
          aria-label="Próxima foto"
          className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-text-brown shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition hover:bg-white active:scale-95 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <ChevronIcon direction="right" />
        </button>

        <div className="pointer-events-auto absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para slide ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`rounded-full transition-all ${
                i === index ? "h-1.5 w-4 bg-white" : "h-1.5 w-1.5 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>

        <span className="pointer-events-none absolute bottom-2.5 right-3 z-10 rounded-md bg-black/35 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
          {index + 1}/{slideCount}
        </span>
      </div>
    </div>
  );
}
