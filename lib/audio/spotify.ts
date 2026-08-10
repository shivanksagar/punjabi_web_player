import type {
  PlaybackProvider,
  PlayerListener,
  PlayerState,
  Track,
} from "./types";
import { loadScript } from "./loadScript";
import {
  clearSpotifyToken,
  getSpotifyToken,
  hasSpotifyClientId,
  redirectToSpotifyLogin,
} from "./spotify-auth";
import { SPOTIFY_PLAYLIST_ID } from "@/config/playlist";

declare global {
  interface Window {
    Spotify?: {
      Player: new (options: {
        name: string;
        getOAuthToken: (callback: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
  }
}

interface SpotifyTrackInfo {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

interface SpotifyPlayerState {
  paused: boolean;
  position_ms: number;
  duration_ms: number;
  track_window: {
    current_track: SpotifyTrackInfo;
  };
}

interface SpotifyPlayerInstance {
  connect(): Promise<boolean>;
  disconnect(): void;
  play(options?: { context_uri?: string; uris?: string[] }): Promise<void>;
  pause(): Promise<void>;
  nextTrack(): Promise<void>;
  previousTrack(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  addListener(
    event: string,
    callback: (payload?: SpotifyPlayerState | { device_id?: string }) => void,
  ): boolean;
  removeListener(event: string, callback: unknown): boolean;
}

const SDK_URL = "https://sdk.scdn.co/spotify-player.js";
const FALLBACK_ART =
  "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?auto=format&fit=crop&w=300&q=80";

export class SpotifyPlaybackProvider implements PlaybackProvider {
  readonly id = "spotify" as const;

  private listeners = new Set<PlayerListener>();
  private player: SpotifyPlayerInstance | null = null;
  private deviceId: string | null = null;
  private apiReady: Promise<void> | null = null;
  private queue: Track[] = [];
  private state: PlayerState = {
    track: null,
    index: 0,
    status: "idle",
    position: 0,
    duration: 0,
    volume: 0.8,
  };

  getState(): PlayerState {
    return this.state;
  }

  subscribe(listener: PlayerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  isAuthenticated(): boolean {
    return Boolean(getSpotifyToken());
  }

  login(): Promise<void> {
    if (!hasSpotifyClientId()) {
      throw new Error(
        "NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set — add it to .env.local (Spotify dashboard → Your apps).",
      );
    }
    return redirectToSpotifyLogin();
  }

  async loadQueue(tracks: Track[], startIndex = 0): Promise<void> {
    this.queue = tracks;
    void startIndex;
    const token = getSpotifyToken();
    if (!token) {
      throw new Error("Spotify not authenticated — call provider.login() first.");
    }
    await this.ensurePlayer(token);
    await this.waitForDevice();

    if (SPOTIFY_PLAYLIST_ID) {
      await this.player!.play({
        context_uri: `spotify:playlist:${SPOTIFY_PLAYLIST_ID}`,
      });
    } else {
      const uris = this.queue
        .map((track) => track.spotifyUri)
        .filter((uri): uri is string => Boolean(uri));
      if (uris.length === 0) {
        throw new Error(
          "No spotifyUri values found — fill them in data/tracks.ts or set SPOTIFY_PLAYLIST_ID in config/playlist.ts.",
        );
      }
      await this.player!.play({ uris });
    }
    this.setState({ ...this.state, status: "loading" });
  }

  async play(): Promise<void> {
    await this.ensurePlayer();
    await this.player?.play();
    this.setState({ ...this.state, status: "playing" });
  }

  async pause(): Promise<void> {
    await this.ensurePlayer();
    await this.player?.pause();
    this.setState({ ...this.state, status: "paused" });
  }

  async toggle(): Promise<void> {
    if (this.state.status === "playing") {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async next(): Promise<void> {
    await this.ensurePlayer();
    await this.player?.nextTrack();
  }

  async previous(): Promise<void> {
    await this.ensurePlayer();
    await this.player?.previousTrack();
  }

  async seek(seconds: number): Promise<void> {
    await this.ensurePlayer();
    await this.player?.seek(Math.round(seconds * 1000));
    this.setState({ ...this.state, position: seconds });
  }

  setVolume(volume: number): void {
    const next = Math.min(1, Math.max(0, volume));
    this.setState({ ...this.state, volume: next });
    void this.player?.setVolume(next);
  }

  logout(): void {
    this.player?.disconnect();
    this.player = null;
    this.deviceId = null;
    clearSpotifyToken();
    this.setState({
      track: null,
      index: 0,
      status: "idle",
      position: 0,
      duration: 0,
      volume: this.state.volume,
    });
  }

  destroy(): void {
    this.player?.disconnect();
    this.player = null;
    this.listeners.clear();
  }

  private ensurePlayer(token?: string): Promise<void> {
    const accessToken = token ?? getSpotifyToken();
    if (this.player) return Promise.resolve();
    if (!accessToken) {
      return Promise.reject(new Error("Spotify not authenticated."));
    }
    if (!this.apiReady) this.apiReady = this.loadSdk(accessToken);
    return this.apiReady;
  }

  private loadSdk(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Spotify?.Player) {
        resolve();
        return;
      }
      loadScript(SDK_URL)
        .catch((error) => {
          reject(error);
          return;
        })
        .then(() => this.waitForSdk())
        .then(() => {
          const player = new window.Spotify!.Player({
            name: "lofi drift",
            getOAuthToken: (callback) => callback(getSpotifyToken() ?? token),
            volume: this.state.volume,
          });

          player.addListener("ready", (payload) => {
            if (payload && "device_id" in payload) {
              this.deviceId = payload.device_id ?? null;
            }
          });
          player.addListener("player_state_changed", (payload) => {
            if (payload && "track_window" in payload) {
              this.handlePlayerState(payload as SpotifyPlayerState);
            }
          });

          this.player = player;
          void player.connect().then((connected) => {
            if (connected) resolve();
            else reject(new Error("Spotify Web Playback SDK failed to connect."));
          });
        })
        .catch((error) => reject(error));
    });
  }

  private waitForSdk(): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (window.Spotify?.Player) {
          resolve();
          return;
        }
        if (Date.now() - started > 15000) {
          reject(new Error("Spotify SDK timed out while loading."));
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }

  private waitForDevice(): Promise<void> {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (this.deviceId) {
          resolve();
          return;
        }
        if (Date.now() - started > 10000) {
          reject(new Error("No active Spotify device — is another device playing?"));
          return;
        }
        setTimeout(check, 200);
      };
      check();
    });
  }

  private handlePlayerState(sdkState: SpotifyPlayerState): void {
    const t = sdkState.track_window.current_track;
    const track: Track = {
      id: t.id,
      title: t.name,
      artist: t.artists.map((artist) => artist.name).join(", "),
      album: t.album.name,
      albumArt: t.album.images[0]?.url ?? FALLBACK_ART,
      duration: Math.round(sdkState.duration_ms / 1000),
      spotifyUri: t.uri,
    };
    this.setState({
      ...this.state,
      track,
      index: 0,
      status: sdkState.paused ? "paused" : "playing",
      position: sdkState.position_ms / 1000,
      duration: sdkState.duration_ms / 1000,
    });
  }

  private setState(next: PlayerState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(this.state));
  }
}
