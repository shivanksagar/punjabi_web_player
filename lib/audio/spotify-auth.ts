const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? "";
const REDIRECT_URI = `${typeof window !== "undefined" ? window.location.origin : ""}/callback`;
const STORAGE_KEYS = {
  verifier: "lofi_spotify_verifier",
  token: "lofi_spotify_token",
  expiry: "lofi_spotify_token_expiry",
};

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateVerifier(): string {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256(plain: string): Promise<string> {
  const data = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function hasSpotifyClientId(): boolean {
  return CLIENT_ID.length > 0;
}

export function redirectToSpotifyLogin(): Promise<void> {
  if (!CLIENT_ID) {
    throw new Error(
      "NEXT_PUBLIC_SPOTIFY_CLIENT_ID is not set. Add it to .env.local — see Spotify dashboard → Your apps.",
    );
  }
  const verifier = generateVerifier();
  localStorage.setItem(STORAGE_KEYS.verifier, verifier);

  return sha256(verifier).then((challenge) => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: REDIRECT_URI,
      scope: "streaming user-read-email user-read-private",
      code_challenge: challenge,
      code_challenge_method: "S256",
      show_dialog: "true",
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  });
}

export async function exchangeSpotifyCode(code: string): Promise<void> {
  const verifier = localStorage.getItem(STORAGE_KEYS.verifier);
  if (!CLIENT_ID || !verifier) {
    throw new Error("Missing Spotify client id or code verifier.");
  }
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Spotify token exchange failed: ${data.error ?? "unknown"}`);
  }
  localStorage.setItem(STORAGE_KEYS.token, data.access_token);
  localStorage.setItem(
    STORAGE_KEYS.expiry,
    String(Date.now() + (data.expires_in ?? 3600) * 1000),
  );
  if (data.refresh_token) {
    localStorage.setItem("lofi_spotify_refresh", data.refresh_token);
  }
}

export function getSpotifyToken(): string | null {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const expiry = localStorage.getItem(STORAGE_KEYS.expiry);
  if (!token) return null;
  if (expiry && Number(expiry) < Date.now()) return null;
  return token;
}

export function clearSpotifyToken(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.expiry);
  localStorage.removeItem(STORAGE_KEYS.verifier);
}
