"use client";

import { useEffect, useState } from "react";

const SESSION_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const HEARTBEAT_MS = 5000;

export function OnlineIndicator() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const res = await fetch(`/api/online?id=${SESSION_ID}`);
        const data = (await res.json()) as { online?: number };
        if (active && typeof data.online === "number") {
          setOnline(data.online);
        }
      } catch {
        // keep the last known value
      }
    };
    void refresh();
    const id = setInterval(() => void refresh(), HEARTBEAT_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="font-pixel text-sm text-white/80 text-glow md:text-base">
        {online === null ? "…" : `${online} online`}
      </span>
    </div>
  );
}
