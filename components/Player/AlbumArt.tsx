import Image from "next/image";
import type { Track } from "@/lib/audio/types";

const FALLBACK_ART =
  "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=300&q=80";

export function AlbumArt({ track }: { track: Track | null }) {
  return (
    <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20">
      <Image
        src={track?.albumArt ?? FALLBACK_ART}
        alt={track?.title ?? "track artwork"}
        fill
        sizes="80px"
        className="rounded-xl object-cover"
      />
    </div>
  );
}
