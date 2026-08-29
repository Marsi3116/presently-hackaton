import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Muestra estatica del output real del Red Team. Vende el producto mostrandolo
// en vez de describirlo, sin romper la regla de "una sola accion" del user flow.
const HALLAZGOS = [
  {
    severidad: "critical" as const,
    etiqueta: "CRÍTICO",
    slide: "SLIDE 04",
    titulo: "Claim sin evidencia",
    cita: "«Reducción del 43% en tiempo de preparación»",
    detalle: "Sin fuente, sin tamaño de muestra, sin período de medición.",
  },
  {
    severidad: "warning" as const,
    etiqueta: "WARNING",
    slide: "SLIDE 06",
    titulo: "Unicidad no defendible",
    cita: "«Somos únicos en el mercado»",
    detalle: "Existen tres competidores directos con la misma promesa.",
  },
];

const ETAPAS = [
  { n: "01", nombre: "UPLOAD" },
  { n: "02", nombre: "RED TEAM" },
  { n: "03", nombre: "PRESENTACIÓN" },
  { n: "04", nombre: "Q&A" },
  { n: "05", nombre: "CHAOS" },
  { n: "06", nombre: "REPORTE" },
];

export default function LandingPage() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="grid-field pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,transparent_20%,var(--bg)_75%)]"
      />

      {/* ---------- barra superior ---------- */}
      <header className="relative z-10 flex items-center justify-between border-b border-hairline px-6 py-4 md:px-10">
        <div className="flex items-center gap-3">
          <span className="size-2 bg-crimson pulse-dot" aria-hidden />
          <span className="label-meta">PRESENTLY</span>
          <span className="hidden text-hairline-strong sm:inline">/</span>
          <span className="label-meta hidden sm:inline">SISTEMA ACTIVO</span>
        </div>
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

      {/* ---------- hero ---------- */}
      <main className="relative z-10 flex-1">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          {/* columna izquierda */}
          <div>
            <p className="label-sec">&#9656; SEC 00 &middot; BRIEFING</p>

            <h1
              className="display mt-5 font-bold text-ink"
              style={{ fontSize: "clamp(3.25rem, 9vw, 6rem)", lineHeight: 0.9 }}
            >
              Presently
            </h1>

            <div className="mt-7 border-l-2 border-crimson pl-5">
              <p className="text-xl leading-snug text-ink md:text-2xl">
                No practiques tu presentación.
                <br />
                <span className="display font-semibold">Sobrevívela.</span>
              </p>
            </div>

            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ink-muted">
              Subes tu presentación. Un red team encuentra lo que no cierra. Después un
              jurado con voz te lo pregunta en vivo — y a mitad de camino
              aparece un competidor real que no estaba en tus slides.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <Button asChild size="lg">
                <Link href="/new">Nueva presentación &rarr;</Link>
              </Button>
              <span className="label-meta">3 ESCENARIOS &middot; 3 MIN</span>
            </div>
          </div>

          {/* columna derecha — muestra del reporte */}
          <div className="corner-ticks relative border border-hairline bg-bg-elevated">
            <div className="border-t-[3px] border-t-crimson" aria-hidden />

            <div className="flex items-start justify-between gap-4 border-b border-hairline px-6 py-5">
              <div>
                <p className="label-sec">REPORTE RED TEAM</p>
                <p className="mt-1.5 font-mono text-[11px] tracking-[0.15em] text-ink-muted uppercase">
                  MUESTRA &middot; PITCH DE HACKATHON
                </p>
              </div>
              <div className="text-right">
                <p
                  className="display font-bold text-crimson tabular-nums"
                  style={{ fontSize: "2.75rem", lineHeight: 1, letterSpacing: "-0.03em" }}
                >
                  43
                </p>
                <p className="label-meta mt-1">READINESS</p>
              </div>
            </div>

            <ul className="divide-y divide-hairline">
              {HALLAZGOS.map((h) => (
                <li key={h.slide} className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Badge variant={h.severidad}>{h.etiqueta}</Badge>
                    <span className="label-meta">{h.slide}</span>
                  </div>
                  <p className="mt-3 text-[15px] font-medium text-ink">
                    {h.titulo}
                  </p>
                  <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-ink-soft">
                    {h.cita}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                    {h.detalle}
                  </p>
                </li>
              ))}
            </ul>

            <div className="border-t border-hairline bg-bg-input/40 px-6 py-5">
              <div className="flex items-center justify-between">
                <p className="label-meta">PREGUNTA MÁS PROBABLE</p>
                <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-amber tabular-nums">
                  87%
                </p>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft italic">
                &laquo;¿Cómo calcularon el 43%? Cuántas empresas, qué baseline,
                qué período.&raquo;
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ---------- pie: las 6 etapas ---------- */}
      <footer className="relative z-10 border-t border-hairline">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {ETAPAS.map((e) => (
            <li
              key={e.n}
              className="border-r border-b border-hairline px-5 py-4 last:border-r-0 lg:border-b-0"
            >
              <span className="font-mono text-[11px] font-bold text-crimson tabular-nums">
                {e.n}
              </span>
              <p className="label-meta mt-1">{e.nombre}</p>
            </li>
          ))}
        </ul>
        <div className="border-t border-hairline px-6 py-4 md:px-10">
          <p className="label-meta text-center">
            THE NEXT CRAFT 2026 &middot; TRACK OUT OF THE BOX
          </p>
        </div>
      </footer>
    </div>
  );
}
