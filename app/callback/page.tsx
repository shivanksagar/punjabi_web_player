"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeSpotifyCode } from "@/lib/audio/spotify-auth";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const code = params.get("code");
  const paramError = params.get("error");
  const cancelled = paramError !== null || code === null;

  useEffect(() => {
    if (cancelled) {
      const id = setTimeout(() => router.replace("/"), 2500);
      return () => clearTimeout(id);
    }

    let active = true;
    exchangeSpotifyCode(code)
      .then(() => router.replace("/"))
      .catch((cause: unknown) => {
        if (active) {
          setExchangeError(
            cause instanceof Error ? cause.message : "Failed to connect Spotify.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [cancelled, code, router]);

  const message =
    paramError ?? exchangeError ?? (cancelled ? "login cancelled…" : "connecting spotify…");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-pixel text-lg text-white/80">{message}</p>
      {!exchangeError && !paramError && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
