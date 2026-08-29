import { cn } from "@/lib/utils";

const SUBSCORE_LABELS: Record<string, string> = {
  argumentation: "ARGUMENTACIÓN",
  evidence: "EVIDENCIA",
  narrative: "NARRATIVA",
  defendability: "DEFENDIBILIDAD",
};

export function scoreColor(score: number): string {
  if (score < 50) return "text-crimson";
  if (score < 75) return "text-amber";
  return "text-teal";
}

function barColor(score: number): string {
  if (score < 50) return "bg-crimson";
  if (score < 75) return "bg-amber";
  return "bg-teal";
}

export function ReadinessScore({
  score,
  subscores,
  summary,
}: {
  score: number;
  subscores: Record<string, number>;
  summary: string;
}) {
  return (
    <section className="border border-hairline bg-bg-elevated">
      <div className="border-t-[3px] border-t-crimson" aria-hidden />
      <div className="grid gap-8 p-6 md:grid-cols-[auto_1fr] md:gap-10 md:p-8">
        <div>
          <p className="label-meta">PRESENTATION READINESS</p>
          <p
            className={cn("display mt-2 font-bold tabular-nums", scoreColor(score))}
            style={{ fontSize: "5.5rem", lineHeight: 0.85, letterSpacing: "-0.04em" }}
          >
            {score}
          </p>
          <p className="label-meta mt-1">/ 100</p>
        </div>

        <div className="space-y-4">
          {Object.entries(subscores).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-baseline justify-between">
                <span className="label-meta">{SUBSCORE_LABELS[key] ?? key}</span>
                <span className="font-mono text-[13px] font-medium text-ink-soft tabular-nums">
                  {value}
                </span>
              </div>
              <div className="mt-1.5 h-[3px] w-full bg-bg-input">
                <div
                  className={cn("h-full", barColor(value))}
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="border-t border-hairline px-6 py-5 text-[15px] leading-relaxed text-ink-soft md:px-8">
        {summary}
      </p>
    </section>
  );
}
