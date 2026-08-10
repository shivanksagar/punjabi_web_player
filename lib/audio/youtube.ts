import type {
  PlaybackProvider,
  PlayerListener,
  PlayerState,
  Track,
} from "./types";
import { loadScript } from "./loadScript";
import { YOUTUBE_PLAYLIST_ID } from "@/config/playlist";

declare global {
  interface Window {
    YT?: {
      Player: new (
        host: string | HTMLElement,
        options: {
          width: string | number;
          height: string | number;
          playerVars?: Record<string, string | number>;
          events?: Record<string, (event: { data: number }) => void>;
        },
      ) => YouTubePlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  nextVideo(): void;
  previousVideo(): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVideoData(): { title: string; video_id: string; author: string };
  setVolume(volume: number): void;
  destroy(): void;
}

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

const API_URL = "https://www.youtube.com/iframe_api";
const THUMB_BASE = "https://i.ytimg.com/vi";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class YouTubePlaybackProvider implements PlaybackProvider {
  readonly id = "youtube" as const;

  private queue: Track[] = [];
  private index = 0;
  private listeners = new Set<PlayerListener>();
  private player: YouTubePlayerInstance | null = null;
  private host: HTMLDivElement | null = null;
  private apiReady: Promise<void> | null = null;
  private readyPromise: Promise<void> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly usePlaylist = Boolean(YOUTUBE_PLAYLIST_ID);
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

  async loadQueue(tracks: Track[], startIndex = 0): Promise<void> {
    this.queue = tracks;
    this.index = tracks.length ? clamp(startIndex, 0, tracks.length - 1) : 0;
    await this.ensurePlayer();

    if (this.usePlaylist) {
      this.setState({
        ...this.state,
        track: null,
        index: this.index,
        duration: 0,
        position: 0,
        status: "paused",
      });
      return;
    }

    const track = this.queue[this.index];
    if (!track?.youtubeId) {
      this.setState({
        ...this.state,
        track: null,
        status: "error",
        error: "Track is missing a youtubeId — fill it in data/tracks.ts",
      });
      return;
    }

    this.setState({
      ...this.state,
      track,
      index: this.index,
      duration: track.duration,
      position: 0,
      status: "loading",
    });
    this.player!.cueVideoById(track.youtubeId);
    this.setState({ ...this.state, status: "paused" });
  }

  async play(): Promise<void> {
    await this.ensurePlayer();
    if (this.state.status !== "playing") {
      this.setState({ ...this.state, status: "playing" });
    }
    this.player!.playVideo();
  }

  async pause(): Promise<void> {
    await this.ensurePlayer();
    if (this.state.status === "playing") {
      this.setState({ ...this.state, status: "paused" });
    }
    this.player!.pauseVideo();
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
    if (this.usePlaylist) {
      this.player!.nextVideo();
      return;
    }
    this.advance(1);
  }

  async previous(): Promise<void> {
    if (this.state.position > 3) {
      await this.seek(0);
    } else {
      await this.ensurePlayer();
      if (this.usePlaylist) {
        this.player!.previousVideo();
        return;
      }
      this.advance(-1);
    }
  }

  async seek(seconds: number): Promise<void> {
    await this.ensurePlayer();
    this.player!.seekTo(clamp(seconds, 0, this.state.duration), true);
    this.setState({ ...this.state, position: clamp(seconds, 0, this.state.duration) });
  }

  setVolume(volume: number): void {
    const next = clamp(volume, 0, 1);
    this.setState({ ...this.state, volume: next });
    this.player?.setVolume(Math.round(next * 100));
  }

  destroy(): void {
    this.stopPolling();
    this.player?.destroy();
    this.player = null;
    this.host?.remove();
    this.host = null;
    this.readyPromise = null;
    this.listeners.clear();
  }

  private advance(direction: number): void {
    if (this.queue.length === 0) return;
    this.index = (this.index + direction + this.queue.length) % this.queue.length;
    const track = this.queue[this.index];
    if (!track.youtubeId) {
      this.setState({ ...this.state, status: "error", error: "Track is missing a youtubeId." });
      return;
    }
    this.setState({
      ...this.state,
      track,
      index: this.index,
      duration: track.duration,
      position: 0,
      status: "playing",
    });
    this.player?.loadVideoById(track.youtubeId);
    this.player?.playVideo();
  }

  private ensurePlayer(): Promise<void> {
    if (this.readyPromise) return this.readyPromise;
    if (!this.apiReady) this.apiReady = this.loadApi();
    return this.apiReady.then(() => {
      if (this.readyPromise) return this.readyPromise;
      this.host = document.createElement("div");
      this.host.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;";
      document.body.appendChild(this.host);
      const host = this.host;
      this.readyPromise = new Promise((resolve) => {
        this.player = new window.YT!.Player(host, {
          width: "1",
          height: "1",
          playerVars: {
            playsinline: 1,
            controls: 0,
            disablekb: 1,
            rel: 0,
            iv_load_policy: 3,
            ...(YOUTUBE_PLAYLIST_ID
              ? { listType: "playlist", list: YOUTUBE_PLAYLIST_ID }
              : {}),
          },
          events: {
            onReady: () => resolve(),
            onStateChange: (event: { data: number }) => this.handleStateChange(event.data),
          },
        });
      });
      return this.readyPromise;
    });
  }

  private loadApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.YT?.Player) {
        resolve();
        return;
      }
      let settled = false;
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      loadScript(API_URL).catch((error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error("YouTube IFrame API timed out while loading."));
        }
      }, 15000);
    });
  }

  private handleStateChange(code: number): void {
    const player = this.player;
    if (!player) return;

    switch (code) {
      case YT_STATE.PLAYING: {
        this.startPolling();
        const duration = player.getDuration() || this.state.duration;
        const track = this.usePlaylist
          ? this.buildTrackFromPlayer(player)
          : this.state.track;
        this.setState({
          ...this.state,
          track,
          status: "playing",
          duration,
          position: player.getCurrentTime(),
        });
        break;
      }
      case YT_STATE.PAUSED:
        this.stopPolling();
        this.setState({
          ...this.state,
          status: "paused",
          position: player.getCurrentTime(),
        });
        break;
      case YT_STATE.ENDED:
        this.stopPolling();
        if (!this.usePlaylist) {
          if (this.queue.length > 1 || this.index < this.queue.length - 1) {
            void this.next();
          } else {
            this.setState({ ...this.state, status: "ended", position: this.state.duration });
          }
        }
        break;
      case YT_STATE.BUFFERING:
        if (this.state.status !== "playing") {
          this.setState({ ...this.state, status: "loading" });
        }
        break;
      default:
        break;
    }
  }

  private buildTrackFromPlayer(player: YouTubePlayerInstance): Track {
    const data = player.getVideoData();
    const videoId = data?.video_id;
    const previous = this.state.track;
    return {
      id: videoId ?? previous?.id ?? "",
      title: data?.title ?? previous?.title ?? "untitled",
      artist: data?.author ?? "youtube",
      album: "youtube playlist",
      albumArt: videoId
        ? `${THUMB_BASE}/${videoId}/mqdefault.jpg`
        : previous?.albumArt ?? "",
      duration: player.getDuration() || previous?.duration || 0,
      youtubeId: videoId,
      youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
    };
  }

  private startPolling(): void {
    if (this.pollTimer !== null) return;
    this.pollTimer = setInterval(() => {
      if (this.state.status !== "playing" || !this.player) return;
      this.setState({ ...this.state, position: this.player.getCurrentTime() });
    }, 500);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private setState(next: PlayerState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(this.state));
  }
}
