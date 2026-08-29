"use client";

import { useEffect, useState } from "react";

export function ChaosOverlay({
  headline,
  body,
  callToAction,
  seconds,
  onDone,
}: {
  headline: string;
  body: string;
  callToAction: string;
  seconds: number;
  onDone: () => void;
}) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      onDone();
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onDone]);

  return (
    // Carmin pleno a pantalla completa: es el unico momento de la app que
    // rompe el dark mode, y esta buscado.
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-crimson px-6 text-center"
      style={{ animation: "chaos-in 200ms ease-out" }}
    >
      <p className="font-mono text-[11px] font-bold tracking-[0.25em] text-ink uppercase">
        🔥 CHAOS EVENT &middot; COMPETITOR ATTACK
      </p>

      <h2
        className="display mt-8 max-w-4xl font-bold text-ink"
        style={{ fontSize: "clamp(2rem, 6vw, 4.25rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
      >
        {headline}
      </h2>

      <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink/90 md:text-xl">
        {body}
      </p>

      <p
        className="display mt-10 font-bold text-ink tabular-nums"
        style={{ fontSize: "clamp(4rem, 14vw, 8rem)", lineHeight: 0.85 }}
      >
        {String(Math.floor(left / 60)).padStart(2, "0")}:
        {String(left % 60).padStart(2, "0")}
      </p>

      <p className="mt-8 border border-ink/40 px-6 py-3 font-mono text-[13px] tracking-[0.12em] text-ink uppercase">
        {callToAction}
      </p>
    </div>
  );
}
