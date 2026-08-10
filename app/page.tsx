import { Background } from "@/components/Background";
import { Footer } from "@/components/Footer";
import { Overlay } from "@/components/Overlay";
import { Player } from "@/components/Player/Player";
import { Title } from "@/components/Title";
import { TopNav } from "@/components/TopNav";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <Background />
      <Overlay />
      <TopNav />
      <Title />
      <div className="relative z-30 flex flex-col items-center gap-3 px-4 pb-4 md:pb-5">
        <Player />
        <Footer />
      </div>
    </main>
  );
}
