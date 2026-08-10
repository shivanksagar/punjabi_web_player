import type {
  PlaybackProvider,
  PlayerListener,
  PlayerState,
  Track,
} from "./types";

const TICK_MS = 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class MockPlaybackProvider implements PlaybackProvider {
  readonly id = "mock" as const;

  private queue: Track[] = [];
  private index = 0;
  private listeners = new Set<PlayerListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
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
    this.startTicking();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopTicking();
    };
  }

  async loadQueue(tracks: Track[], startIndex = 0): Promise<void> {
    this.queue = tracks;
    this.index = tracks.length ? clamp(startIndex, 0, tracks.length - 1) : 0;
    const track = this.queue[this.index] ?? null;
    this.setState({
      ...this.state,
      track,
      index: this.index,
      duration: track?.duration ?? 0,
      position: 0,
      status: track ? "paused" : "idle",
    });
  }

  async play(): Promise<void> {
    if (this.state.status !== "playing") {
      this.setState({ ...this.state, status: "playing" });
    }
  }

  async pause(): Promise<void> {
    if (this.state.status === "playing") {
      this.setState({ ...this.state, status: "paused" });
    }
  }

  async toggle(): Promise<void> {
    if (this.state.status === "playing") {
      await this.pause();
    } else {
      await this.play();
    }
  }

  async next(): Promise<void> {
    this.advance(1);
  }

  async previous(): Promise<void> {
    if (this.state.position > 3) {
      await this.seek(0);
    } else {
      this.advance(-1);
    }
  }

  async seek(seconds: number): Promise<void> {
    const duration = this.state.duration;
    this.setState({ ...this.state, position: clamp(seconds, 0, duration) });
  }

  setVolume(volume: number): void {
    this.setState({ ...this.state, volume: clamp(volume, 0, 1) });
  }

  destroy(): void {
    this.stopTicking();
    this.listeners.clear();
  }

  private advance(direction: number): void {
    if (this.queue.length === 0) return;
    this.index = (this.index + direction + this.queue.length) % this.queue.length;
    const track = this.queue[this.index];
    this.setState({
      ...this.state,
      track,
      index: this.index,
      duration: track.duration,
      position: 0,
      status: "playing",
    });
  }

  private setState(next: PlayerState): void {
    this.state = next;
    this.listeners.forEach((listener) => listener(this.state));
  }

  private startTicking(): void {
    if (this.timer !== null) return;
    if (typeof window === "undefined") return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private stopTicking(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    if (this.state.status !== "playing") return;
    const next = this.state.position + TICK_MS / 1000;
    if (next >= this.state.duration) {
      this.setState({ ...this.state, position: this.state.duration, status: "ended" });
      return;
    }
    this.setState({ ...this.state, position: next });
  }
}
