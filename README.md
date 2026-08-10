# lofi drift — ambient radio

A nostalgic, full-screen lo-fi ambient music player built with Next.js (App Router) + Tailwind CSS.

## Features

- Full-viewport background artwork (`public/old_punjab.png`), glassmorphism player
- Live digital clock, real concurrent "online" listener count
- Playback providers behind a shared interface (`lib/audio/types.ts`):
  - `mock` — simulated playback (no audio)
  - `youtube` — real streaming via the YouTube IFrame API (video IDs or a playlist)
  - `spotify` — real streaming via the Spotify Web Playback SDK (OAuth PKCE, Premium required)
- Swappable playlist / platform links via `config/`

## Configuration

| File | What it controls |
| --- | --- |
| `config/streaming.ts` | `STREAMING_SOURCE`: `"mock"` \| `"youtube"` \| `"spotify"` |
| `config/playlist.ts` | Spotify/YouTube playlist IDs and URLs |
| `config/assets.ts` | Background image, title, subtitle, footer name + LinkedIn URL |
| `data/tracks.ts` | Track list with per-track `spotifyUri` / `youtubeId` |
| `.env.local` | `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` (see `.env.example`) |

instances. To make it accurate, add **Vercel KV** (Project → Storage → Create KV) — the counter auto-uses it via `KV_REST_API_URL` / `KV_REST_API_TOKEN`.


