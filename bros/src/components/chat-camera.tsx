"use client";

import { useEffect, useRef, useState } from "react";

const VIDEO_MAX_MS = 20_000;

function recorderMime() {
  const options = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return options.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function ChatCamera({
  mode,
  onCapture,
  onClose,
  onError,
}: {
  mode: "photo" | "video";
  onCapture: (file: File) => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: mode === "video",
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setReady(true);
      } catch {
        onErrorRef.current("Libere a câmera (e o microfone, no vídeo) no navegador.");
        onCloseRef.current();
      }
    })();

    return () => {
      cancelled = true;
      const stream = streamRef.current;
      streamRef.current = null;
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [mode]);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const tick = window.setInterval(() => {
      const next = Date.now() - started;
      setElapsed(next);
      if (next >= VIDEO_MAX_MS) stopVideo();
    }, 200);
    return () => window.clearInterval(tick);
  }, [recording]);

  function takePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onError("Não deu para capturar a foto.");
          return;
        }
        onCapture(new File([blob], "camera.jpg", { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.86,
    );
  }

  function startVideo() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = recorderMime();
    if (!mime || typeof MediaRecorder === "undefined") {
      onError("Este navegador não grava vídeo. Use a galeria.");
      return;
    }
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (!streamRef.current) return;
      const type = recorder.mimeType.includes("mp4") ? "video/mp4" : "video/webm";
      const ext = type === "video/mp4" ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type });
      onCapture(new File([blob], `camera.${ext}`, { type }));
      onClose();
    };
    recorderRef.current = recorder;
    recorder.start();
    setElapsed(0);
    setRecording(true);
  }

  function stopVideo() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  const seconds = Math.floor(elapsed / 1000);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-[13px] font-bold">
          {mode === "photo" ? "Tirar foto" : "Gravar vídeo"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-2 text-[13px] font-bold"
        >
          Fechar
        </button>
      </div>

      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        {!ready ? (
          <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">
            Abrindo a câmera…
          </p>
        ) : null}
        {recording ? (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-danger px-3 py-1 text-[12px] font-bold">
            REC {String(seconds).padStart(2, "0")}s
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-4 px-4 py-6">
        {mode === "photo" ? (
          <button
            type="button"
            disabled={!ready}
            onClick={takePhoto}
            className="h-16 w-16 rounded-full border-4 border-white bg-accent"
            aria-label="Capturar"
          />
        ) : recording ? (
          <button
            type="button"
            onClick={stopVideo}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-danger"
            aria-label="Parar"
          >
            <span className="h-6 w-6 rounded-sm bg-white" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!ready}
            onClick={startVideo}
            className="h-16 w-16 rounded-full border-4 border-white bg-danger"
            aria-label="Gravar"
          />
        )}
      </div>
      {mode === "video" ? (
        <p className="pb-4 text-center text-[12px] text-muted">
          Até 20 segundos. Pare quando quiser.
        </p>
      ) : (
        <p className="h-4" />
      )}
    </div>
  );
}
