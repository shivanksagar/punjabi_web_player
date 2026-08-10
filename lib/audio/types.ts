export type StreamingSource = "mock" | "spotify" | "youtube";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  spotifyUri?: string;
  spotifyUrl?: string;
  youtubeId?: string;
  youtubeUrl?: string;
}

export type PlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "ended"
  | "error";

export interface PlayerState {
  track: Track | null;
  index: number;
  status: PlaybackStatus;
  position: number;
  duration: number;
  volume: number;
  error?: string;
}

export type PlayerListener = (state: PlayerState) => void;

export interface PlaybackProvider {
  readonly id: StreamingSource;
  getState(): PlayerState;
  subscribe(listener: PlayerListener): () => void;
  loadQueue(tracks: Track[], startIndex?: number): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  toggle(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  seek(seconds: number): Promise<void>;
  setVolume(volume: number): void;
  destroy(): void;
  login?: () => Promise<void>;
  isAuthenticated?: () => boolean;
}
