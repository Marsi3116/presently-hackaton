"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ESCENARIOS = [
  { value: "hackathon", label: "Pitch de hackathon", nota: "Jurado técnico y directo" },
  { value: "thesis", label: "Defensa de tesis", nota: "Foco en metodología" },
  { value: "investor", label: "Pitch a inversionistas", nota: "Foco en unit economics" },
] as const;

const DURACIONES = [3, 5, 10] as const;

type Escenario = (typeof ESCENARIOS)[number]["value"];

export function NewSessionForm() {
  const router = useRouter();
  const createSession = useMutation(api.sessions.create);

  const [scenario, setScenario] = useState<Escenario>("hackathon");
  const [duration, setDuration] = useState<number>(3);
  const [goal, setGoal] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const sessionId = await createSession({
        scenario,
        duration,
        goal: goal.trim() || "Convencer al jurado",
      });
      router.push(`/upload/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la sesión.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-10">
      <fieldset>
        <legend className="label-meta">ESCENARIO</legend>
        <div className="mt-4 divide-y divide-hairline border border-hairline">
          {ESCENARIOS.map((op) => {
            const activo = scenario === op.value;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => setScenario(op.value)}
                aria-pressed={activo}
                className={cn(
                  "flex w-full items-center justify-between px-5 py-4 text-left transition-colors",
                  activo ? "bg-bg-elevated" : "hover:bg-bg-elevated/50"
                )}
              >
                <span>
                  <span
                    className={cn(
                      "block text-[15px] font-medium",
                      activo ? "text-ink" : "text-ink-soft"
                    )}
                  >
                    {op.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-ink-muted">
                    {op.nota}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "size-2.5 shrink-0 border",
                    activo ? "border-crimson bg-crimson" : "border-hairline-strong"
                  )}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label-meta">DURACIÓN</legend>
        <div className="mt-4 flex gap-2">
          {DURACIONES.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setDuration(min)}
              aria-pressed={duration === min}
              className={cn(
                "border px-5 py-2.5 font-mono text-[13px] tracking-[0.05em] transition-colors",
                duration === min
                  ? "border-crimson bg-crimson text-ink"
                  : "border-hairline-strong text-ink-soft hover:border-ink-muted hover:bg-bg-elevated"
              )}
            >
              {min} MIN
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="goal" className="label-meta">
          OBJETIVO
        </label>
        <Input
          id="goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Convencer al jurado de darnos el primer lugar"
          maxLength={200}
          className="mt-4"
        />
      </div>

      {error !== null && (
        <p className="border-l-2 border-crimson bg-crimson-dim/20 px-4 py-3 text-[14px] text-ink">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={enviando}>
        {enviando ? "Creando…" : "Continuar →"}
      </Button>
    </form>
  );
}
