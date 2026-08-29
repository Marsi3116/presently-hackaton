"use client";

import { useEffect, useRef, useState } from "react";

export function ChaosOverlay({
  headline,
  body,
  callToAction,
  seconds,
  modoTexto,
  onDone,
}: {
  headline: string;
  body: string;
  callToAction: string;
  seconds: number;
  /** En texto no puede "hablar": escribe la respuesta dentro del overlay. */
  modoTexto: boolean;
  onDone: (respuestaEscrita?: string) => void;
}) {
  const [left, setLeft] = useState(seconds);
  const [escrito, setEscrito] = useState("");
  const escritoRef = useRef("");
  const cerrado = useRef(false);

  escritoRef.current = escrito;

  useEffect(() => {
    if (cerrado.current) return;
    if (left <= 0) {
      cerrado.current = true;
      onDone(escritoRef.current);
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  const cerrarYa = () => {
    if (cerrado.current) return;
    cerrado.current = true;
    onDone(escritoRef.current);
  };

  return (
    // Carmin pleno a pantalla completa: es el unico momento de la app que
    // rompe el dark mode, y esta buscado.
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-y-auto bg-crimson px-5 py-10 text-center sm:px-6"
      style={{ animation: "chaos-in 200ms ease-out" }}
    >
      <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-ink uppercase sm:text-[11px] sm:tracking-[0.25em]">
        🔥 CHAOS EVENT &middot; COMPETITOR ATTACK
      </p>

      <h2
        className="display mt-6 max-w-4xl font-bold text-ink sm:mt-8"
        style={{
          fontSize: "clamp(1.6rem, 6vw, 4.25rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        {headline}
      </h2>

      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink/90 sm:mt-7 sm:text-lg md:text-xl">
        {body}
      </p>

      <p
        className="display mt-7 font-bold text-ink tabular-nums sm:mt-10"
        style={{ fontSize: "clamp(3rem, 13vw, 8rem)", lineHeight: 0.85 }}
      >
        {String(Math.floor(left / 60)).padStart(2, "0")}:
        {String(left % 60).padStart(2, "0")}
      </p>

      <p className="mt-6 border border-ink/40 px-4 py-2.5 font-mono text-[11px] tracking-[0.1em] text-ink uppercase sm:mt-8 sm:px-6 sm:py-3 sm:text-[13px] sm:tracking-[0.12em]">
        {callToAction}
      </p>

      {modoTexto && (
        <div className="mt-7 w-full max-w-xl sm:mt-8">
          <label htmlFor="chaos-respuesta" className="sr-only">
            Tu respuesta al chaos event
          </label>
          <textarea
            id="chaos-respuesta"
            autoFocus
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            placeholder="Escribe por qué sigues siendo distinto…"
            rows={3}
            className="w-full resize-none rounded-[2px] border border-ink/40 bg-crimson-dim/40 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/50 focus:border-ink"
          />
          <button
            type="button"
            onClick={cerrarYa}
            className="mt-3 w-full rounded-[2px] border border-ink bg-ink px-6 py-3 text-[14px] font-semibold text-crimson transition-opacity hover:opacity-90 sm:w-auto"
          >
            Enviar respuesta &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
