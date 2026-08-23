"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buttonClass } from "@/components/ui";
import { clampOffset, coverScale, cropImageToFile } from "@/lib/crop-image";

const CROP_ASPECTS = [
  { label: "Perfil", value: 4 / 5 },
  { label: "Quadrado", value: 1 },
];

export function PhotoCropper({
  file,
  saveLabel = "Salvar no perfil",
  isPrivate = false,
  onPrivateChange,
  onCancel,
  onConfirm,
}: {
  file: File;
  saveLabel?: string;
  isPrivate?: boolean;
  onPrivateChange?: (value: boolean) => void;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [keepRatio, setKeepRatio] = useState(false);
  const [naturalAspect, setNaturalAspect] = useState(4 / 5);
  const [aspect, setAspect] = useState(4 / 5);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ file: File; url: string } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setReady(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (review?.url && review.url !== src) URL.revokeObjectURL(review.url);
    };
  }, [review, src]);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [aspect, keepRatio]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function applyOffset(x: number, y: number, nextZoom = zoom) {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image?.naturalWidth) {
      setOffset({ x, y });
      return;
    }
    setOffset(
      clampOffset(
        x,
        y,
        frame.clientWidth,
        frame.clientHeight,
        image.naturalWidth,
        image.naturalHeight,
        nextZoom,
      ),
    );
  }

  function layout() {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image?.naturalWidth) return null;
    const scale = coverScale(
      frame.clientWidth,
      frame.clientHeight,
      image.naturalWidth,
      image.naturalHeight,
      zoom,
    );
    return {
      width: image.naturalWidth * scale,
      height: image.naturalHeight * scale,
      left: (frame.clientWidth - image.naturalWidth * scale) / 2 + offset.x,
      top: (frame.clientHeight - image.naturalHeight * scale) / 2 + offset.y,
    };
  }

  const box = ready ? layout() : null;

  async function goToReview() {
    if (keepRatio) {
      setReview({ file, url: src ?? URL.createObjectURL(file) });
      return;
    }
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;
    setBusy(true);
    try {
      const cropped = await cropImageToFile(image, frame, zoom, offset, file.name);
      setReview({ file: cropped, url: URL.createObjectURL(cropped) });
    } finally {
      setBusy(false);
    }
  }

  function backToEdit() {
    if (review?.url && review.url !== src) URL.revokeObjectURL(review.url);
    setReview(null);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col bg-black">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <button type="button" onClick={onCancel} className={buttonClass.ghost}>
          Cancelar
        </button>
        <p className="text-[15px] font-bold">
          {review
            ? "Confirmar"
            : keepRatio
              ? "Proporção original"
              : "Cortar foto"}
        </p>
        {review ? (
          <button
            type="button"
            onClick={() => onConfirm(review.file)}
            className={buttonClass.primary}
          >
            {saveLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={goToReview}
            disabled={busy || !ready}
            className={buttonClass.primary}
          >
            {busy ? "Preparando…" : "Continuar"}
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        {review ? (
          <img
            src={review.url}
            alt="Prévia da foto"
            className="max-h-[min(70dvh,36rem)] max-w-full object-contain"
          />
        ) : (
        <div
          ref={frameRef}
          onPointerDown={(event) => {
            if (keepRatio) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              x: event.clientX,
              y: event.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onPointerMove={(event) => {
            if (keepRatio || !drag.current) return;
            applyOffset(
              drag.current.ox + event.clientX - drag.current.x,
              drag.current.oy + event.clientY - drag.current.y,
            );
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onWheel={(event) => {
            if (keepRatio) return;
            event.preventDefault();
            const next = Math.min(3, Math.max(1, zoom + (event.deltaY < 0 ? 0.12 : -0.12)));
            setZoom(next);
            applyOffset(offset.x, offset.y, next);
          }}
          className={`relative w-full max-w-sm overflow-hidden bg-[#111] ${
            keepRatio ? "" : "cursor-grab active:cursor-grabbing"
          }`}
          style={{ aspectRatio: keepRatio ? `${naturalAspect}` : `${aspect}` }}
        >
          {src ? (
            <img
              ref={imageRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={() => {
                const image = imageRef.current;
                if (image?.naturalWidth && image.naturalHeight) {
                  setNaturalAspect(image.naturalWidth / image.naturalHeight);
                }
                setReady(true);
              }}
              className={
                keepRatio
                  ? "h-full w-full object-contain"
                  : "pointer-events-none absolute max-w-none select-none"
              }
              style={
                keepRatio
                  ? undefined
                  : box
                    ? {
                        width: box.width,
                        height: box.height,
                        left: box.left,
                        top: box.top,
                      }
                    : { opacity: 0 }
              }
            />
          ) : null}
        </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm space-y-4 px-4 pb-8 pt-4">
        {review ? (
          <>
            <p className="text-center text-[13px] text-muted">
              Confira a foto. Ela só entra no perfil depois de salvar.
            </p>
            {onPrivateChange ? (
              <button
                type="button"
                onClick={() => onPrivateChange(!isPrivate)}
                className={`w-full rounded-full px-4 py-2 text-[13px] font-bold ${
                  isPrivate
                    ? "bg-bg-elevated text-ink"
                    : "bg-accent text-accent-ink"
                }`}
              >
                {isPrivate ? "Vai entrar privada" : "Vai entrar pública"}
              </button>
            ) : null}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onConfirm(review.file)}
                className={`${buttonClass.primary} w-full`}
              >
                {saveLabel}
              </button>
              <button
                type="button"
                onClick={backToEdit}
                className={`${buttonClass.secondary} w-full`}
              >
                Ajustar
              </button>
            </div>
          </>
        ) : (
          <>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setKeepRatio(false)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold ${
              !keepRatio ? "bg-accent text-accent-ink" : "bg-bg-elevated text-muted"
            }`}
          >
            Cortar
          </button>
          <button
            type="button"
            onClick={() => setKeepRatio(true)}
            className={`rounded-full px-4 py-2 text-[13px] font-bold ${
              keepRatio ? "bg-accent text-accent-ink" : "bg-bg-elevated text-muted"
            }`}
          >
            Proporção
          </button>
        </div>
        {keepRatio ? (
          <p className="text-center text-[12px] text-muted">
            A foto inteira entra, sem corte, no tamanho original.
          </p>
        ) : (
          <>
            <div className="flex justify-center gap-2">
              {CROP_ASPECTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setAspect(item.value)}
                  className={`rounded-full px-4 py-2 text-[13px] font-bold ${
                    aspect === item.value
                      ? "bg-accent text-accent-ink"
                      : "bg-bg-elevated text-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1 block text-center text-[11px] font-bold uppercase tracking-wide text-muted">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setZoom(next);
                  applyOffset(offset.x, offset.y, next);
                }}
                className="w-full accent-accent"
              />
            </label>
            <p className="text-center text-[12px] text-muted">
              Arraste para enquadrar. Depois continue para confirmar.
            </p>
          </>
        )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
