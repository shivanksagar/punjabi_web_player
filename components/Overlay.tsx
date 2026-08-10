export function Overlay() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-b from-black/55 via-black/15 to-black/65" />
      <div className="pointer-events-none fixed inset-0 z-10 opacity-[0.05] mix-blend-overlay noise" />
      <div className="pointer-events-none fixed inset-0 z-10 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </>
  );
}
