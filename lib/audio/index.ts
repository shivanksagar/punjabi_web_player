import type { PlaybackProvider, StreamingSource } from "./types";
import { MockPlaybackProvider } from "./mock";
import { SpotifyPlaybackProvider } from "./spotify";
import { YouTubePlaybackProvider } from "./youtube";
import { STREAMING_SOURCE } from "@/config/streaming";

let instance: PlaybackProvider | null = null;

export function getPlaybackProvider(
  source: StreamingSource = STREAMING_SOURCE,
): PlaybackProvider {
  if (instance) return instance;

  switch (source) {
    case "spotify":
      instance = new SpotifyPlaybackProvider();
      break;
    case "youtube":
      instance = new YouTubePlaybackProvider();
      break;
    default:
      instance = new MockPlaybackProvider();
  }

  return instance;
}

export function resetPlaybackProvider(): void {
  instance?.destroy();
  instance = null;
}
