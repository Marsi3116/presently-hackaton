"use client";

import { cn } from "@/lib/utils";

export type JuryState = "idle" | "listening" | "thinking" | "speaking";

const ESTADO = {
  idle: { label: "EN ESPERA", dot: "bg-ink-muted", ring: "border-hairline" },
  listening: { label: "ESCUCHANDO", dot: "bg-teal", ring: "border-teal" },
  thinking: { label: "PENSANDO", dot: "bg-amber", ring: "border-amber" },
  speaking: { label: "HABLANDO", dot: "bg-crimson", ring: "border-crimson" },
} as const;

export function JuryAvatar({
  state,
  name,
  role,
  volume,
}: {
  state: JuryState;
  name: string;
  role: string;
  /** 0..1 del SDK de Vapi. Mueve la waveform mientras el jurado habla. */
  volume: number;
}) {
  const e = ESTADO[state];
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative flex size-36 items-center justify-center border-2 transition-colors sm:size-52 md:size-64",
          e.ring
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-3 right-3 size-2.5",
            e.dot,
            state === "listening" && "pulse-dot"
          )}
        />
        <span
          className="display text-4xl font-bold text-ink-muted select-none sm:text-6xl md:text-7xl"
          aria-hidden
        >
          {name.slice(0, 1)}
        </span>

        {state === "speaking" && (
          <div className="absolute bottom-5 flex items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className="w-[3px] bg-crimson transition-[height] duration-100"
                style={{
                  height: `${6 + Math.abs(Math.sin((i + 1) * 1.7)) * volume * 34}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="label-meta mt-5">{e.label}</p>
      <p className="display mt-2 text-xl font-semibold text-ink">{name}</p>
      <p className="mt-1 text-[13px] text-ink-muted">{role}</p>
    </div>
  );
}
