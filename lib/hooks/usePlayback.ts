"use client";

import { useSyncExternalStore } from "react";
import { getPlaybackProvider } from "@/lib/audio";
import type { PlaybackProvider, PlayerState } from "@/lib/audio/types";

const provider: PlaybackProvider = getPlaybackProvider();

export function usePlayback(): {
  state: PlayerState;
  provider: PlaybackProvider;
} {
  const state = useSyncExternalStore(
    (onStoreChange) => provider.subscribe(onStoreChange),
    () => provider.getState(),
    () => provider.getState(),
  );

  return { state, provider };
}
