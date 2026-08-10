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

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production

Build and start:

```bash
npm run build
npm run start
```

## Deploying

### Option A — Vercel (recommended for Next.js)

1. Push this folder to a GitHub repo.
2. Import the repo at https://vercel.com/new. Framework preset `Next.js` is auto-detected.
3. Add env vars in **Project → Settings → Environment Variables** (`NEXT_PUBLIC_SPOTIFY_CLIENT_ID` if using Spotify).
4. Deploy. The build runs `npm run build` automatically.

**Live listener count on Vercel:** the `/api/online` counter falls back to a per-server in-memory store, which is not shared across serverless instances. To make it accurate, add **Vercel KV** (Project → Storage → Create KV) — the counter auto-uses it via `KV_REST_API_URL` / `KV_REST_API_TOKEN`.

### Option B — Single-instance Node host (Render / Railway / Fly / VPS)

Any host that runs a long-lived Node process keeps the listener count accurate in-memory.

- Render: new **Web Service** → root directory → build `npm run build`, start `npm run start`.
- Railway: import repo, `npm run build` then `npm run start`.
- VPS: install Node 20+, `npm ci && npm run build && npm run start` (optionally behind PM2/nginx).

### Spotify redirect URI

After deploying, add your production URL as a **Redirect URI** in the Spotify Dashboard (Settings → Your apps) and set `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` to the app's Client ID. Playback requires a **Spotify Premium** account.

### YouTube playlist

`config/playlist.ts` → set `YOUTUBE_PLAYLIST_ID` (e.g. `PLxxxx...`) to stream a real playlist. Or fill per-track `youtubeId` in `data/tracks.ts`. No keys or auth needed.
