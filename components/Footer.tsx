import { PROFILE_NAME, PROFILE_URL } from "@/config/assets";

export function Footer() {
  return (
    <p className="font-pixel text-xs text-white/40">
      crafted by{" "}
      <a
        href={PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-white/70 underline underline-offset-2 transition-colors hover:text-white"
      >
        {PROFILE_NAME}
      </a>
    </p>
  );
}
