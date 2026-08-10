import type { PlaybackStatus, Track } from "@/lib/audio/types";

export function TrackInfo({
  track,
  status,
  error,
}: {
  track: Track | null;
  status: PlaybackStatus;
  error?: string | null;
}) {
  if (error) {
    return (
      <div className="font-pixel truncate text-xs text-red-300 md:text-sm">
        {error}
      </div>
    );
  }

  if (!track) {
    return (
      <div className="font-pixel text-xs text-white/40 md:text-sm">
        {status === "loading" ? "loading…" : "nothing playing yet"}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className="font-display truncate text-sm text-white md:text-base">
        {track.title}
      </p>
      <p className="font-pixel mt-0.5 truncate text-xs text-white/60 md:text-sm">
        {track.artist} · {track.album}
      </p>
    </div>
  );
}
