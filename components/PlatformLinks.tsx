"use client";

import { SquarePlay } from "lucide-react";
import { YOUTUBE_PLAYLIST_URL } from "@/config/playlist";
import { usePlayback } from "@/lib/hooks/usePlayback";

export function PlatformLinks() {
  const { state } = usePlayback();
  const track = state.track;

  const youtubeHref =
    track?.youtubeUrl ??
    (track?.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : null) ??
    YOUTUBE_PLAYLIST_URL ??
    "#";

  const LINKS = [
    { label: "youtube music", href: youtubeHref, icon: SquarePlay },
  ];

  return (
    <nav className="flex items-center gap-4 md:gap-6">
      {LINKS.map(({ label, href, icon: Icon }) =>
        href === "#" ? (
          <span
            key={label}
            className="pointer-events-none flex cursor-not-allowed items-center gap-1.5 font-pixel text-sm text-white/35 md:text-base"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </span>
        ) : (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-pixel text-sm text-white/70 transition-colors hover:text-white md:text-base"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </a>
        ),
      )}
    </nav>
  );
}
