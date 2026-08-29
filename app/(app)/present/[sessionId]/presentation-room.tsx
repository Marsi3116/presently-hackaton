"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JuryAvatar, type JuryState } from "@/components/jury-avatar";
import { ChaosOverlay } from "@/components/chaos-overlay";
import { JURADOS, assistantIdFor, type Scenario } from "@/lib/jury";

const CHAOS_SEGUNDOS = 30;
/** Turnos del jurado antes del Chaos Event (docs/00-mvp-scope.md). */
const TURNOS_ANTES_DEL_CHAOS = 3;

type Fase = "listo" | "conectando" | "en_vivo" | "chaos" | "cerrando" | "error";
type Modo = "voz" | "texto";

export function PresentationRoom({ sessionId }: { sessionId: Id<"sessions"> }) {
  const router = useRouter();
  const session = useQuery(api.sessions.get, { sessionId });
  const mensajes = useQuery(api.qa.listBySession, { sessionId }) ?? [];
  const chaos = useQuery(api.chaos.getBySession, { sessionId });

  const triggerChaos = useAction(api.actions.triggerChaos);
  const generateReport = useAction(api.actions.generateReport);
  const setStatus = useMutation(api.sessions.setStatus);
  const addTranscript = useMutation(api.transcripts.add);
  const addQa = useMutation(api.qa.add);
  const submitChaos = useMutation(api.chaos.submitResponse);

  const [modo, setModo] = useState<Modo>("voz");
  const [fase, setFase] = useState<Fase>("listo");
  const [juryState, setJuryState] = useState<JuryState>("idle");
  const [volumen, setVolumen] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enVivo, setEnVivo] = useState("");
  const [escrito, setEscrito] = useState("");
  const [pensando, setPensando] = useState(false);

  const vapiRef = useRef<{ stop: () => void; setMuted: (m: boolean) => void } | null>(null);
  const chaosDisparado = useRef(false);
  const inicioRef = useRef<number>(0);
  const chaosInicioRef = useRef<number>(0);

  const scenario = (session?.scenario ?? "hackathon") as Scenario;
  const jurado = JURADOS[scenario];
  const enCurso = fase === "en_vivo" || fase === "chaos";

  // ---- cronometro ----
  useEffect(() => {
    if (!enCurso) return;
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enCurso]);

  const ahora = useCallback(
    () => Math.max(0, Math.floor((Date.now() - inicioRef.current) / 1000)),
    []
  );

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
      chaosInicioRef.current = Date.now();
      setFase("chaos");
      void setStatus({ sessionId, status: "chaos" }).catch(() => {});
      vapiRef.current?.setMuted(true);
    }
  }, [chaos, fase, sessionId, setStatus]);

  // ---- arranque comun a los dos modos ----
  const arrancar = useCallback(() => {
    inicioRef.current = Date.now();
    setSegundos(0);
    setFase("en_vivo");
    setJuryState("listening");
    void setStatus({ sessionId, status: "presenting" }).catch(() => {});
  }, [sessionId, setStatus]);

  // ---- modo voz ----
  const empezarVoz = useCallback(async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    const assistantId = assistantIdFor(scenario);
    if (publicKey === undefined || assistantId === undefined) {
      setError("Faltan NEXT_PUBLIC_VAPI_PUBLIC_KEY o el assistant ID. Usa el modo texto.");
      setFase("error");
      return;
    }

    setFase("conectando");
    setError(null);
    try {
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      vapi.on("call-start", arrancar);
      vapi.on("speech-start", () => setJuryState("speaking"));
      vapi.on("speech-end", () => setJuryState("listening"));
      vapi.on("volume-level", (v: number) => setVolumen(v));
      vapi.on("call-end", () => {
        setJuryState("idle");
        setFase((f) => (f === "chaos" ? f : "cerrando"));
      });
      vapi.on("error", (e: unknown) => {
        console.error("[vapi]", e);
        setError(
          "El sistema de voz fallo. Puede ser falta de creditos o de microfono. Cambia a modo texto para seguir."
        );
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
        if (msg.transcriptType !== "final") return;
        setEnVivo("");
        const texto = msg.transcript ?? "";
        if (msg.role === "user") {
          setJuryState("thinking");
          // Sin esto la tabla transcripts queda vacia y el After Action
          // Report evalua la presentacion sin haberla leido.
          void addTranscript({
            sessionId,
            text: texto,
            startTimestamp: ahora(),
            endTimestamp: ahora(),
            phase: chaosDisparado.current ? "qa" : "presentation",
          }).catch(() => {});
        }
      });

      // El sessionId viaja en metadata: /api/llm lo lee para inyectar el
      // Red Team report en el contexto del jurado.
      await vapi.start(assistantId, { metadata: { sessionId } });
    } catch (e) {
      console.error("[present]", e);
      setError(
        (e instanceof Error ? e.message : "No se pudo iniciar la llamada.") +
          " Puedes seguir en modo texto."
      );
      setFase("error");
    }
  }, [scenario, sessionId, arrancar, addTranscript, ahora]);

  // ---- modo texto: mismo endpoint, sin voz ----
  const enviarTexto = useCallback(async () => {
    const texto = escrito.trim();
    if (texto.length === 0 || pensando) return;
    setEscrito("");
    setPensando(true);
    setJuryState("thinking");

    const t = ahora();
    await addQa({ sessionId, role: "user", text: texto, timestamp: t }).catch(() => {});
    await addTranscript({
      sessionId,
      text: texto,
      startTimestamp: t,
      endTimestamp: t,
      phase: chaosDisparado.current ? "qa" : "presentation",
    }).catch(() => {});

    try {
      const historial = mensajes.map((m) => ({
        role: m.role === "jury" ? "assistant" : "user",
        content: m.text,
      }));
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: { sessionId },
          messages: [...historial, { role: "user", content: texto }],
        }),
      });
      if (!res.ok || res.body === null) throw new Error(`HTTP ${res.status}`);

      // El endpoint responde en SSE de OpenAI porque asi lo consume Vapi.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let respuesta = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lineas = buffer.split("\n");
        buffer = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (!linea.startsWith("data: ")) continue;
          const payload = linea.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload) as {
              choices?: Array<{ delta?: { content?: string } }>;
            };
            respuesta += j.choices?.[0]?.delta?.content ?? "";
          } catch {
            // chunk partido entre lecturas; el buffer lo recompone
          }
        }
      }
      setJuryState("speaking");
      setTimeout(() => setJuryState("listening"), 900);
      if (respuesta.trim().length === 0) {
        setError("El jurado no devolvio respuesta. Reintenta.");
      }
    } catch (e) {
      console.error("[present/texto]", e);
      setError("No se pudo contactar al jurado. Reintenta.");
      setJuryState("listening");
    } finally {
      setPensando(false);
    }
  }, [escrito, pensando, ahora, addQa, addTranscript, sessionId, mensajes]);

  const cerrarChaos = useCallback(() => {
    const dur = Math.max(
      1,
      Math.round((Date.now() - chaosInicioRef.current) / 1000)
    );
    // Lo que dijo durante los 30 segundos del overlay.
    const respuesta = mensajes
      .filter((m) => m.role === "user")
      .slice(-2)
      .map((m) => m.text)
      .join(" ");
    void submitChaos({
      sessionId,
      userResponse: respuesta.length > 0 ? respuesta : "(sin respuesta registrada)",
      responseDurationSec: dur,
    }).catch(() => {});
    setFase("en_vivo");
    void setStatus({ sessionId, status: "qa" }).catch(() => {});
    vapiRef.current?.setMuted(false);
  }, [mensajes, sessionId, submitChaos, setStatus]);

  const terminar = useCallback(async () => {
    vapiRef.current?.stop();
    setFase("cerrando");
    await setStatus({ sessionId, status: "reporting" }).catch(() => {});
    try {
      await generateReport({ sessionId });
    } catch (e) {
      console.error("[present] fallo el reporte:", e);
    }
    router.push(`/report/${sessionId}`);
  }, [generateReport, router, sessionId, setStatus]);

  useEffect(() => () => vapiRef.current?.stop(), []);

  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const excedido = segundos > (session?.duration ?? 3) * 60;

  return (
    <div className="flex min-h-dvh flex-col">
      {fase === "chaos" && chaos !== null && chaos !== undefined && (
        <ChaosOverlay
          headline={chaos.headline}
          body={chaos.body}
          callToAction={chaos.callToAction}
          seconds={CHAOS_SEGUNDOS}
          onDone={cerrarChaos}
        />
      )}

      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline px-6 py-4 md:px-10">
        <div className="flex items-center gap-4">
          <span className="label-sec">&#9656; SEC 04 &middot; EN VIVO</span>
          <span className="label-meta hidden sm:inline">{scenario.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-6">
          {!enCurso && (
            <div className="flex border border-hairline-strong">
              {(["voz", "texto"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModo(m)}
                  aria-pressed={modo === m}
                  className={`px-3 py-1.5 font-mono text-[11px] tracking-[0.15em] uppercase transition-colors ${
                    modo === m ? "bg-crimson text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
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
        <section className="flex flex-col border-hairline p-6 md:p-10 lg:border-r">
          <h2 className="label-meta">TRANSCRIPCION</h2>
          <ul className="mt-6 flex-1 space-y-5">
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
            {pensando && <li className="label-meta">EL JURADO ESTA PENSANDO&hellip;</li>}
            {mensajes.length === 0 && enVivo.length === 0 && (
              <li className="text-[15px] text-ink-muted">
                Cuando empieces, lo que digas aparece aqui.
              </li>
            )}
          </ul>

          {modo === "texto" && enCurso && (
            <form
              className="mt-8 flex gap-3 border-t border-hairline pt-6"
              onSubmit={(e) => {
                e.preventDefault();
                void enviarTexto();
              }}
            >
              <Input
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                placeholder="Escribe lo que dirias en voz alta…"
                disabled={pensando}
                autoFocus
              />
              <Button type="submit" disabled={pensando || escrito.trim().length === 0}>
                Enviar
              </Button>
            </form>
          )}
        </section>

        <aside className="flex flex-col items-center justify-center gap-8 border-t border-hairline p-8 lg:w-[26rem] lg:border-t-0">
          <JuryAvatar
            state={juryState}
            name={jurado.name}
            role={jurado.role}
            volume={volumen}
          />

          {error !== null && (
            <p className="w-full border-l-2 border-crimson bg-crimson-dim/20 px-4 py-3 text-[14px] leading-relaxed text-ink">
              {error}
            </p>
          )}

          <div className="flex w-full flex-col gap-3">
            {(fase === "listo" || fase === "error") && (
              <>
                <Button
                  size="lg"
                  onClick={() => (modo === "voz" ? void empezarVoz() : arrancar())}
                >
                  {modo === "voz" ? "Empezar con voz →" : "Empezar en texto →"}
                </Button>
                {modo === "voz" && (
                  <p className="text-center font-mono text-[11px] tracking-[0.12em] text-ink-muted uppercase">
                    NECESITA MICROFONO Y CREDITOS DE VOZ
                  </p>
                )}
              </>
            )}
            {fase === "conectando" && (
              <Button size="lg" disabled>
                Conectando&hellip;
              </Button>
            )}
            {enCurso && (
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
