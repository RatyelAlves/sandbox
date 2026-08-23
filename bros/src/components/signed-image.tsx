"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignedImage({
  path,
  alt,
  className,
  bucket = "photos",
}: {
  path: string;
  alt: string;
  className?: string;
  bucket?: "photos" | "chat";
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelled) setSrc(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);

  if (!src) {
    return <div className={cn("animate-pulse bg-bg-soft", className)} />;
  }

  return (
    // Signed URLs from private storage; next/image is awkward with query tokens.
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
