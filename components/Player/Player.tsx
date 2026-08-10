"use client";

import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { MOCK_TRACKS } from "@/data/tracks";
import { usePlayback } from "@/lib/hooks/usePlayback";
import { AlbumArt } from "./AlbumArt";
import { Controls } from "./Controls";
import { ProgressBar } from "./ProgressBar";
import { TrackInfo } from "./TrackInfo";

export function Player() {
  const { state, provider } = usePlayback();
  const [loadError, setLoadError] = useState<string | null>(null);

  const needsSpotifyAuth =
    provider.id === "spotify" && provider.isAuthenticated?.() === false;

  useEffect(() => {
    if (state.track !== null) return;
    if (needsSpotifyAuth) return;
    provider
      .loadQueue(MOCK_TRACKS, 0)
      .then(() => setLoadError(null))
      .catch((cause: unknown) =>
        setLoadError(cause instanceof Error ? cause.message : "Failed to load playback."),
      );
  }, [state.track, provider, needsSpotifyAuth]);

  if (needsSpotifyAuth) {
    return (
      <div className="glass w-[min(94vw,36rem)] rounded-2xl p-6 text-center">
        <p className="font-display text-lg text-white">connect spotify</p>
        <p className="font-pixel mt-2 text-xs text-white/60">
          streaming a playlist requires a Spotify Premium account.
        </p>
        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            void provider
              .login?.()
              .catch((cause: unknown) =>
                setLoadError(cause instanceof Error ? cause.message : "Login failed."),
              );
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 font-pixel text-base text-white transition-colors hover:bg-white/25"
        >
          <LogIn className="h-4 w-4" />
          sign in with spotify
        </button>
        {loadError && (
          <p className="font-pixel mt-3 text-xs text-red-300">{loadError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass w-[min(94vw,58rem)] rounded-2xl p-3 md:p-4">
      <div className="flex items-center gap-3 md:gap-5">
        <AlbumArt track={state.track} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
          <TrackInfo track={state.track} status={state.status} error={loadError} />
          <ProgressBar state={state} provider={provider} />
        </div>
        <Controls state={state} provider={provider} />
      </div>
    </div>
  );
}
