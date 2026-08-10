import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import type { PlaybackProvider, PlayerState } from "@/lib/audio/types";

export function Controls({
  state,
  provider,
}: {
  state: PlayerState;
  provider: PlaybackProvider;
}) {
  const isPlaying = state.status === "playing";

  return (
    <div className="flex shrink-0 items-center gap-2 md:gap-4">
      <button
        type="button"
        aria-label="Previous track"
        onClick={() => void provider.previous()}
        className="rounded-full p-2 text-white/70 transition-colors hover:text-white"
      >
        <SkipBack className="h-5 w-5 md:h-6 md:w-6" />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={() => void provider.toggle()}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white shadow-lg transition-colors hover:bg-white/25 md:h-14 md:w-14"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-5 w-5 md:h-6 md:w-6" fill="currentColor" />
        )}
      </button>

      <button
        type="button"
        aria-label="Next track"
        onClick={() => void provider.next()}
        className="rounded-full p-2 text-white/70 transition-colors hover:text-white"
      >
        <SkipForward className="h-5 w-5 md:h-6 md:w-6" />
      </button>
    </div>
  );
}
