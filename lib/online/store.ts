const sessions = new Map<string, number>();

const TTL_MS = 30000;
const TTL_SECONDS = 40;

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const usesKv = Boolean(KV_URL && KV_TOKEN);

async function kvSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  await fetch(`${KV_URL}/set/${key}/${encodeURIComponent(value)}?ex=${ttlSeconds}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
}

async function kvCountKeys(pattern: string): Promise<number> {
  try {
    const res = await fetch(`${KV_URL}/keys/${pattern}`, {
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { result?: string[] };
    return data.result?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function heartbeat(sessionId: string): Promise<void> {
  if (usesKv) {
    await kvSet(`session:${sessionId}`, "1", TTL_SECONDS);
    return;
  }
  sessions.set(sessionId, Date.now());
}

export async function activeCount(): Promise<number> {
  if (usesKv) {
    return kvCountKeys("session:*");
  }
  const now = Date.now();
  for (const [id, seenAt] of sessions) {
    if (now - seenAt > TTL_MS) sessions.delete(id);
  }
  return sessions.size;
}
