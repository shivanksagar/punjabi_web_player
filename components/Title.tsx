import { APP_SUBTITLE, APP_TITLE } from "@/config/assets";

export function Title() {
  return (
    <div className="pointer-events-none relative z-20 flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-glow text-5xl font-bold uppercase tracking-[0.18em] text-white/95 md:text-7xl lg:text-8xl">
        {APP_TITLE}
      </h1>
      <p className="mt-4 font-pixel text-glow text-sm text-white/60 md:text-lg">
        {APP_SUBTITLE}
      </p>
    </div>
  );
}
