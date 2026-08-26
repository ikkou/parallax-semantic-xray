import dynamic from "next/dynamic";

const ParallaxApp = dynamic(() => import("./parallax-app"), {
  ssr: false,
  loading: () => (
    <main className="app-shell boot-shell">
      <div className="boot-card">
        <div className="brand-name">PARALLAX</div>
        <div className="boot-label">INITIALIZING X-RAY SURFACE</div>
      </div>
    </main>
  ),
});

export default function Page() {
  return <ParallaxApp />;
}
