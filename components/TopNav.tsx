import { Clock } from "./Clock";
import { OnlineIndicator } from "./OnlineIndicator";
import { PlatformLinks } from "./PlatformLinks";

export function TopNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 md:px-10">
      <Clock />
      <OnlineIndicator />
      <PlatformLinks />
    </header>
  );
}
