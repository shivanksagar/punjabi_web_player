import type { MouseEvent } from "react";
import type { PlaybackProvider, PlayerState } from "@/lib/audio/types";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

export function ProgressBar({
  state,
  provider,
}: {
  state: PlayerState;
  provider: PlaybackProvider;
}) {
  const percentage =
    state.duration > 0 ? Math.min(100, (state.position / state.duration) * 100) : 0;

  function handleSeek(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    void provider.seek(fraction * state.duration);
  }

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <span className="w-10 text-right font-pixel text-[10px] text-white/50 md:w-12 md:text-xs">
        {formatTime(state.position)}
      </span>
      <div
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={state.duration}
        aria-valuenow={Math.round(state.position)}
        tabIndex={0}
        onClick={handleSeek}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            void provider.seek(state.position + 5);
          }
          if (event.key === "ArrowLeft") {
            void provider.seek(state.position - 5);
          }
        }}
        className="group h-1 flex-1 cursor-pointer rounded-full bg-white/15 transition-colors hover:bg-white/25"
      >
        <div
          className="h-full rounded-full bg-amber-300/80"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 font-pixel text-[10px] text-white/50 md:w-12 md:text-xs">
        {formatTime(state.duration)}
      </span>
    </div>
  );
}
