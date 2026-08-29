"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Estado = "pidiendo" | "hablando" | "ok" | "sin_permiso" | "sin_senal";

/**
 * Prueba de microfono antes de arrancar.
 *
 * Sin esto, un microfono mudo o un permiso denegado se descubrian recien
 * cuando la llamada ya habia empezado y el jurado no contestaba, que es el
 * peor momento posible para enterarse.
 */
export function VoiceCheck({
  onListo,
  onTexto,
  onCancelar,
}: {
  onListo: () => void;
  onTexto: () => void;
  onCancelar: () => void;
}) {
  const [estado, setEstado] = useState<Estado>("pidiendo");
  const [nivel, setNivel] = useState(0);
  const [pico, setPico] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelado = false;
    let ctx: AudioContext | null = null;

    async function medir() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setEstado("hablando");

        ctx = new AudioContext();
        const fuente = ctx.createMediaStreamSource(stream);
        const analizador = ctx.createAnalyser();
        analizador.fftSize = 512;
        fuente.connect(analizador);
        const datos = new Uint8Array(analizador.frequencyBinCount);

        const tick = () => {
          analizador.getByteTimeDomainData(datos);
          // Desviacion respecto del silencio (128) = cuanto se movio la onda.
          let suma = 0;
          for (const v of datos) suma += Math.abs(v - 128);
          const promedio = suma / datos.length / 128;
          setNivel(promedio);
          setPico((p) => Math.max(p, promedio));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        if (!cancelado) setEstado("sin_permiso");
      }
    }

    void medir();
    return () => {
      cancelado = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
    };
  }, []);

  // Umbral bajo: alcanza con que la onda se mueva, no hace falta gritar.
  useEffect(() => {
    if (estado === "hablando" && pico > 0.02) setEstado("ok");
  }, [pico, estado]);

  // Si en 8 segundos no entro nada, el microfono esta mudo o silenciado.
  useEffect(() => {
    if (estado !== "hablando") return;
    const t = setTimeout(() => {
      setEstado((e) => (e === "hablando" ? "sin_senal" : e));
    }, 8000);
    return () => clearTimeout(t);
  }, [estado]);

  const barras = 24;
  const activas = Math.min(barras, Math.round(nivel * barras * 6));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prueba de microfono"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 px-6"
    >
      <div className="corner-ticks relative w-full max-w-lg border border-hairline bg-bg-elevated p-8">
        <p className="label-sec">&#9656; PRUEBA DE MICROFONO</p>

        {estado === "pidiendo" && (
          <>
            <h2 className="display mt-4 text-2xl font-semibold text-ink">
              Autoriza el micrófono
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              El navegador te va a pedir permiso. Sin eso no hay simulación con
              voz.
            </p>
          </>
        )}

        {(estado === "hablando" || estado === "ok") && (
          <>
            <h2 className="display mt-4 text-2xl font-semibold text-ink">
              {estado === "ok" ? "Te escuchamos" : "Di algo corto"}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              {estado === "ok"
                ? "El micrófono funciona. Ya puedes empezar."
                : "Prueba con “hola, uno, dos, tres”. Solo queremos ver que entra audio."}
            </p>

            <div
              className="mt-7 flex h-12 items-end gap-[3px]"
              aria-hidden
            >
              {Array.from({ length: barras }, (_, i) => (
                <span
                  key={i}
                  className={
                    i < activas
                      ? estado === "ok"
                        ? "flex-1 bg-teal"
                        : "flex-1 bg-crimson"
                      : "flex-1 bg-hairline"
                  }
                  style={{ height: `${8 + (i < activas ? 34 : 0)}px` }}
                />
              ))}
            </div>
          </>
        )}

        {estado === "sin_permiso" && (
          <>
            <h2 className="display mt-4 text-2xl font-semibold text-ink">
              No pudimos usar el micrófono
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              El permiso fue denegado o no hay micrófono disponible. Puedes
              habilitarlo desde el candado en la barra de direcciones y volver a
              intentar, o seguir en modo texto.
            </p>
          </>
        )}

        {estado === "sin_senal" && (
          <>
            <h2 className="display mt-4 text-2xl font-semibold text-ink">
              No entra audio
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              El permiso está dado, pero no llega señal. Revisa que el micrófono
              no esté silenciado y que sea el dispositivo correcto en la
              configuración del navegador.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {estado === "ok" && (
            <Button size="lg" onClick={onListo}>
              Empezar simulación &rarr;
            </Button>
          )}
          {(estado === "sin_permiso" || estado === "sin_senal") && (
            <Button size="lg" onClick={onTexto}>
              Seguir en modo texto &rarr;
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={onCancelar}>
            Cancelar
          </Button>
          {estado === "hablando" && (
            <Button variant="ghost" size="lg" onClick={onTexto}>
              Prefiero escribir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
