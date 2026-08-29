"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReadinessScore, scoreColor } from "@/components/readiness-score";
import { cn } from "@/lib/utils";

const SEVERIDAD_DOT: Record<string, string> = {
  ok: "border-teal",
  info: "border-hairline-strong",
  warning: "border-amber",
  critical: "border-crimson",
};

const PRIORIDAD = {
  high: { variant: "critical" as const, etiqueta: "ALTA" },
  medium: { variant: "warning" as const, etiqueta: "MEDIA" },
  low: { variant: "neutral" as const, etiqueta: "BAJA" },
};

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ReportView({ sessionId }: { sessionId: Id<"sessions"> }) {
  const report = useQuery(api.finalReport.getBySession, { sessionId });
  const timeline = useQuery(api.finalReport.listTimeline, { sessionId }) ?? [];

  if (report === undefined) {
    return <p className="mt-10 label-meta">CARGANDO&hellip;</p>;
  }
  if (report === null) {
    return (
      <div className="mt-10 border border-hairline bg-bg-elevated p-6">
        <p className="label-sec">&#9656; SIN REPORTE</p>
        <p className="mt-3 text-[15px] text-ink-soft">
          Esta sesion todavia no tiene After Action Report.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/present/${sessionId}`}>Ir a la simulacion</Link>
        </Button>
      </div>
    );
  }

  const maxTs = timeline.reduce((max, e) => Math.max(max, e.timestamp), 1);

  return (
    <div className="mt-10 space-y-12">
      <ReadinessScore
        score={report.overallScore}
        subscores={report.subscores}
        summary={report.summary}
      />

      {timeline.length > 0 && (
        <section>
          <h2 className="label-sec">&#9656; LINEA DE TIEMPO</h2>
          <div className="mt-8 border border-hairline bg-bg-elevated p-6 md:p-8">
            <div className="relative h-1 w-full bg-hairline">
              {timeline.map((e) => (
                <span
                  key={e._id}
                  title={`${mmss(e.timestamp)} — ${e.title}`}
                  className={cn(
                    "absolute size-4 -translate-x-1/2 rounded-full border-[3px] bg-bg transition-transform hover:scale-125",
                    SEVERIDAD_DOT[e.severity] ?? "border-hairline-strong"
                  )}
                  style={{ left: `${(e.timestamp / maxTs) * 100}%`, top: "-6px" }}
                />
              ))}
            </div>

            <ul className="mt-10 space-y-5">
              {timeline.map((e) => (
                <li key={e._id} className="flex gap-4">
                  <span className="label-meta w-12 shrink-0 tabular-nums">
                    {mmss(e.timestamp)}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full border-2",
                      SEVERIDAD_DOT[e.severity] ?? "border-hairline-strong"
                    )}
                  />
                  <div>
                    <p className="text-[15px] text-ink">{e.title}</p>
                    {typeof e.detail === "string" && (
                      <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                        {e.detail}
                      </p>
                    )}
                    {e.detail !== null &&
                      e.detail !== undefined &&
                      typeof e.detail === "object" && (
                        <dl className="mt-2 space-y-1">
                          {Object.entries(e.detail as Record<string, unknown>).map(
                            ([k, v]) => (
                              <div key={k} className="flex gap-2 text-[13px]">
                                <dt className="label-meta shrink-0">
                                  {k.replace(/_/g, " ")}
                                </dt>
                                <dd className="text-ink-muted">{String(v)}</dd>
                              </div>
                            )
                          )}
                        </dl>
                      )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="grid gap-px md:grid-cols-2">
        <section className="panel panel-ok">
          <h2 className="label-meta">LO QUE FUNCIONO</h2>
          <ul className="mt-4 space-y-3">
            {report.keyWins.map((w, i) => (
              <li key={i} className="text-[15px] leading-relaxed text-ink-soft">
                <span className="text-teal">+</span> {w}
              </li>
            ))}
            {report.keyWins.length === 0 && (
              <li className="text-[15px] text-ink-muted">Nada destacable.</li>
            )}
          </ul>
        </section>

        <section className="panel panel-warn">
          <h2 className="label-meta">LO QUE FALLO</h2>
          <ul className="mt-4 space-y-3">
            {report.keyMisses.map((m, i) => (
              <li key={i} className="text-[15px] leading-relaxed text-ink-soft">
                <span className="text-crimson">&times;</span> {m}
              </li>
            ))}
            {report.keyMisses.length === 0 && (
              <li className="text-[15px] text-ink-muted">Sin fallos marcados.</li>
            )}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="label-sec">
          &#9656; RECOMENDACIONES ({report.recommendations.length})
        </h2>
        <ul className="mt-5 divide-y divide-hairline border border-hairline bg-bg-elevated">
          {report.recommendations.map((r, i) => (
            <li key={i} className="p-6">
              <div className="flex items-center gap-3">
                <Badge variant={PRIORIDAD[r.priority].variant}>
                  {PRIORIDAD[r.priority].etiqueta}
                </Badge>
                <span className="label-meta">PRIORIDAD</span>
              </div>
              <p className="mt-3 text-[15px] font-medium text-ink">{r.title}</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
                {r.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-5 border-t border-hairline pt-8">
        <Button asChild size="lg">
          <Link href="/new">Practicar de nuevo &rarr;</Link>
        </Button>
        <span className={cn("label-meta", scoreColor(report.overallScore))}>
          SCORE FINAL {report.overallScore} / 100
        </span>
      </div>
    </div>
  );
}
