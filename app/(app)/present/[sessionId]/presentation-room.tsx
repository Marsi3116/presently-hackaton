"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { JuryAvatar, type JuryState } from "@/components/jury-avatar";
import { ChaosOverlay } from "@/components/chaos-overlay";
import { JURADOS, assistantIdFor, type Scenario } from "@/lib/jury";

const CHAOS_SEGUNDOS = 30;
/** Turnos de Q&A antes de disparar el Chaos Event (docs/00-mvp-scope.md). */
const TURNOS_ANTES_DEL_CHAOS = 3;

type Fase = "listo" | "conectando" | "en_vivo" | "chaos" | "cerrando" | "error";

export function PresentationRoom({ sessionId }: { sessionId: Id<"sessions"> }) {
  const router = useRouter();
  const session = useQuery(api.sessions.get, { sessionId });
  const mensajes = useQuery(api.qa.listBySession, { sessionId }) ?? [];
  const chaos = useQuery(api.chaos.getBySession, { sessionId });
  const triggerChaos = useAction(api.actions.triggerChaos);
  const generateReport = useAction(api.actions.generateReport);

  const [fase, setFase] = useState<Fase>("listo");
  const [juryState, setJuryState] = useState<JuryState>("idle");
  const [volumen, setVolumen] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enVivo, setEnVivo] = useState("");

  const vapiRef = useRef<{ stop: () => void; setMuted: (m: boolean) => void } | null>(null);
  const chaosDisparado = useRef(false);

  const scenario = (session?.scenario ?? "hackathon") as Scenario;
  const jurado = JURADOS[scenario];

  // ---- cronometro ----
  useEffect(() => {
    if (fase !== "en_vivo" && fase !== "chaos") return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [fase]);

  // ---- disparo del Chaos Event ----
  const preguntasDelJurado = mensajes.filter((m) => m.role === "jury").length;
  useEffect(() => {
    if (fase !== "en_vivo") return;
    if (chaosDisparado.current) return;
    if (preguntasDelJurado < TURNOS_ANTES_DEL_CHAOS) return;
    chaosDisparado.current = true;
    void triggerChaos({ sessionId }).catch((e) => {
      console.error("[present] fallo el chaos event:", e);
    });
  }, [fase, preguntasDelJurado, sessionId, triggerChaos]);

  useEffect(() => {
    if (chaos !== null && chaos !== undefined && fase === "en_vivo") {
      setFase("chaos");
      vapiRef.current?.setMuted(true);
    }
  }, [chaos, fase]);

  // ---- ciclo de vida de la llamada ----
  const empezar = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = assistantIdFor(scenario);
    if (publicKey === undefined || assistantId === undefined) {
      setError("Faltan NEXT_PUBLIC_VAPI_PUBLIC_KEY o el assistant ID del escenario.");
      setFase("error");
      return;
    }

    setFase("conectando");
    setError(null);
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        setFase("en_vivo");
        setJuryState("listening");
      });
      vapi.on("speech-start", () => setJuryState("speaking"));
      vapi.on("speech-end", () => setJuryState("listening"));
      vapi.on("volume-level", (v: number) => setVolumen(v));
      vapi.on("call-end", () => {
        setJuryState("idle");
        setFase((f) => (f === "chaos" ? f : "cerrando"));
      });
      vapi.on("error", (e: unknown) => {
        console.error("[vapi]", e);
        setError("El sistema de voz se desconecto. Intenta de nuevo.");
        setFase("error");
      });
      vapi.on("message", (msg: {
        type?: string;
        role?: string;
        transcript?: string;
        transcriptType?: string;
      }) => {
        if (msg.type !== "transcript") return;
        if (msg.transcriptType === "partial") {
          setEnVivo(msg.transcript ?? "");
          return;
        }
        if (msg.transcriptType === "final") {
          setEnVivo("");
          if (msg.role === "user") setJuryState("thinking");
        }
      });

      // El sessionId viaja en metadata: /api/llm lo lee para inyectar el
      // Red Team report en el contexto del jurado.
      await vapi.start(assistantId, { metadata: { sessionId } });
    } catch (e) {
      console.error("[present]", e);
      setError(e instanceof Error ? e.message : "No se pudo iniciar la llamada.");
      setFase("error");
    }
  }, [scenario, sessionId]);

  const terminar = useCallback(async () => {
    vapiRef.current?.stop();
    setFase("cerrando");
    try {
      await generateReport({ sessionId });
    } catch (e) {
      console.error("[present] fallo el reporte:", e);
    }
    router.push(`/report/${sessionId}`);
  }, [generateReport, router, sessionId]);

  useEffect(() => () => vapiRef.current?.stop(), []);

  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const objetivo = (session?.duration ?? 3) * 60;
  const excedido = segundos > objetivo;

  return (
    <div className="flex min-h-dvh flex-col">
      {fase === "chaos" && chaos !== null && chaos !== undefined && (
        <ChaosOverlay
          headline={chaos.headline}
          body={chaos.body}
          callToAction={chaos.callToAction}
          seconds={CHAOS_SEGUNDOS}
          onDone={() => {
            setFase("en_vivo");
            vapiRef.current?.setMuted(false);
          }}
        />
      )}

      <header className="flex items-center justify-between border-b border-hairline px-6 py-4 md:px-10">
        <div className="flex items-center gap-4">
          <span className="label-sec">&#9656; SEC 04 &middot; EN VIVO</span>
          <span className="label-meta hidden sm:inline">{scenario.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-6">
          <span
            className={`display text-2xl font-bold tabular-nums ${
              excedido ? "text-crimson" : "text-ink"
            }`}
          >
            {mm}:{ss}
          </span>
          <span className="label-meta hidden md:inline">
            OBJETIVO {session?.duration ?? 3} MIN
          </span>
        </div>
      </header>

      <div className="grid flex-1 lg:grid-cols-[1fr_auto]">
        <section className="border-hairline p-6 md:p-10 lg:border-r">
          <h2 className="label-meta">TRANSCRIPCION</h2>
          <ul className="mt-6 space-y-5">
            {mensajes.map((m) => (
              <li key={m._id}>
                <p className="label-meta">
                  {m.role === "jury" ? jurado.name.toUpperCase() : "TU"}
                </p>
                <p
                  className={`mt-1.5 text-[15px] leading-relaxed ${
                    m.role === "jury" ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {m.text}
                </p>
              </li>
            ))}
            {enVivo.length > 0 && (
              <li>
                <p className="label-meta">TU</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted italic">
                  {enVivo}
                </p>
              </li>
            )}
            {mensajes.length === 0 && enVivo.length === 0 && (
              <li className="text-[15px] text-ink-muted">
                Cuando empieces, lo que digas aparece aqui.
              </li>
            )}
          </ul>
        </section>

        <aside className="flex flex-col items-center justify-center gap-8 border-t border-hairline p-8 lg:w-[26rem] lg:border-t-0">
          <JuryAvatar
            state={juryState}
            name={jurado.name}
            role={jurado.role}
            volume={volumen}
          />

          {error !== null && (
            <p className="w-full border-l-2 border-crimson bg-crimson-dim/20 px-4 py-3 text-[14px] text-ink">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            {(fase === "listo" || fase === "error") && (
              <Button size="lg" onClick={() => void empezar()}>
                Empezar presentacion &rarr;
              </Button>
            )}
            {fase === "conectando" && (
              <Button size="lg" disabled>
                Conectando&hellip;
              </Button>
            )}
            {(fase === "en_vivo" || fase === "chaos") && (
              <Button size="lg" variant="outline" onClick={() => void terminar()}>
                Terminar y generar reporte
              </Button>
            )}
            {fase === "cerrando" && (
              <Button size="lg" disabled>
                Generando reporte&hellip;
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link href={`/red-team/${sessionId}`}>&larr; Volver al Red Team</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
