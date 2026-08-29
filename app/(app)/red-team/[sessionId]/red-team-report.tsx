"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReadinessScore } from "@/components/readiness-score";

const SEVERIDAD = {
  critical: { variant: "critical" as const, etiqueta: "CRÍTICO" },
  warning: { variant: "warning" as const, etiqueta: "WARNING" },
  info: { variant: "neutral" as const, etiqueta: "INFO" },
};

const RIESGO = {
  high: "critical" as const,
  medium: "warning" as const,
  low: "neutral" as const,
};

export function RedTeamReport({ sessionId }: { sessionId: Id<"sessions"> }) {
  const report = useQuery(api.reports.getBySession, { sessionId });

  if (report === undefined) {
    return <p className="mt-10 label-meta">CARGANDO…</p>;
  }
  if (report === null) {
    return (
      <div className="mt-10 border border-hairline bg-bg-elevated p-6">
        <p className="label-sec">&#9656; SIN REPORTE</p>
        <p className="mt-3 text-[15px] text-ink-soft">
          Esta sesión todavía no tiene análisis.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/upload/${sessionId}`}>Subir presentación</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-12">
      <ReadinessScore
        score={report.readinessScore}
        subscores={report.subscores}
        summary={report.summary}
      />

      <section>
        <h2 className="label-sec">
          &#9656; DEBILIDADES DETECTADAS ({report.weaknesses.length})
        </h2>
        <ul className="mt-5 space-y-px">
          {report.weaknesses.map((w, i) => (
            <li key={i} className="border border-hairline bg-bg-elevated p-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={SEVERIDAD[w.severity].variant}>
                  {SEVERIDAD[w.severity].etiqueta}
                </Badge>
                {w.slide !== undefined && (
                  <span className="label-meta">{w.slide.toUpperCase()}</span>
                )}
                <span className="label-meta text-hairline-strong">
                  {w.type.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-ink">{w.title}</h3>
              {w.excerpt !== undefined && (
                <blockquote className="mt-3 border-l-2 border-crimson bg-bg-input/50 px-4 py-2.5 font-mono text-[13px] leading-relaxed text-ink-soft">
                  {w.excerpt}
                </blockquote>
              )}
              <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
                {w.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="label-sec">
          &#9656; PREGUNTAS MÁS PROBABLES ({report.probableQuestions.length})
        </h2>
        <ul className="mt-5 divide-y divide-hairline border border-hairline bg-bg-elevated">
          {report.probableQuestions.map((q, i) => (
            <li key={i} className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant={RIESGO[q.riskLevel]}>{q.riskLevel}</Badge>
                  <span className="label-meta">{q.askedBy}</span>
                </div>
                <span className="font-mono text-[15px] font-bold text-amber tabular-nums">
                  {q.probability}%
                </span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                {q.question}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center gap-5 border-t border-hairline pt-8">
        <Button asChild size="lg">
          <Link href={`/present/${sessionId}`}>Empezar simulación →</Link>
        </Button>
        <span className="label-meta">EL JURADO YA TIENE ESTE REPORTE</span>
      </div>
    </div>
  );
}
