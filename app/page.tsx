import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// docs/01-user-flow.md es explicito: una sola accion, sin features grid, sin
// testimonials, sin "how it works". La densidad va en la tipografia y las
// hairlines, no en secciones.
const STATUS = [
  { label: "RED TEAM", value: "ANÁLISIS PREVIO" },
  { label: "JURADO", value: "VOZ ADVERSARIAL" },
  { label: "CHAOS", value: "COMPETIDOR REAL" },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="grid-field pointer-events-none absolute inset-0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_25%,var(--bg)_78%)]"
      />

      <header className="relative flex items-center justify-between border-b border-hairline px-6 py-4 md:px-10">
        <span className="label-meta">PRESENTLY &middot; V0.1</span>
        <Show
          when="signed-in"
          fallback={
            <SignInButton mode="modal">
              <button className="label-meta transition-colors hover:text-ink">
                INGRESAR
              </button>
            </SignInButton>
          }
        >
          <UserButton />
        </Show>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="label-sec">&#9656; SEC 00 &middot; BRIEFING</p>

        <h1
          className="display mt-6 font-bold text-ink"
          style={{ fontSize: "clamp(3.5rem, 13vw, 6.75rem)", lineHeight: 0.92 }}
        >
          Presently
        </h1>

        <p className="mt-6 max-w-xl text-lg text-ink-soft md:text-xl">
          No practiques tu presentación.{" "}
          <span className="text-ink">Sobrevivila.</span>
        </p>

        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-muted">
          Subís tu deck. Un red team encuentra lo que no cierra. Después un
          jurado con voz te lo pregunta en vivo, hasta romperte.
        </p>

        <div className="mt-12">
          <Button asChild size="lg">
            <Link href="/new">Nueva presentación &rarr;</Link>
          </Button>
        </div>
      </main>

      <footer className="relative border-t border-hairline">
        <div className="mx-auto grid max-w-5xl grid-cols-1 divide-y divide-hairline sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {STATUS.map((item) => (
            <div key={item.label} className="px-6 py-5">
              <p className="label-meta">{item.label}</p>
              <p className="mt-1.5 font-mono text-[13px] text-ink-soft">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t border-hairline px-6 py-4 text-center md:px-10">
          <p className="label-meta">
            THE NEXT CRAFT 2026 &middot; TRACK OUT OF THE BOX
          </p>
        </div>
      </footer>
    </div>
  );
}
