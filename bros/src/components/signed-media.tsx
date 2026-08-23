"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isChatVideo } from "@/lib/upload-chat";
import { cn } from "@/lib/utils";

export function SignedMedia({
  path,
  mime,
  alt,
  className,
}: {
  path: string;
  mime?: string | null;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const video = isChatVideo(mime, path);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from("chat")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setSrc(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!src) {
    return <div className={cn("animate-pulse bg-bg-soft", className)} />;
  }

  if (video) {
    return (
      <video
        src={src}
        controls
        playsInline
        controlsList="nodownload"
        data-protected-photo=""
        onContextMenu={(event) => event.preventDefault()}
        className={cn("bg-black", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      data-protected-photo=""
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
      className={cn(
        "select-none [-webkit-touch-callout:none] [-webkit-user-drag:none]",
        className,
      )}
    />
  );
}
