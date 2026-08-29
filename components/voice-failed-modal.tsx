"use client";

import { Button } from "@/components/ui/button";

/**
 * Aviso cuando la voz se corta a mitad.
 *
 * Antes esto era una linea de texto en la barra lateral: el usuario la leia,
 * cambiaba el switch a TEXTO y no pasaba nada, porque faltaba volver a
 * apretar el boton de empezar. El modal lleva directo al modo texto.
 */
export function VoiceFailedModal({
  detalle,
  onTexto,
  onReintentar,
  onCerrar,
}: {
  detalle: string | null;
  onTexto: () => void;
  onReintentar: () => void;
  onCerrar: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="La voz se interrumpio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 px-6"
    >
      <div className="corner-ticks relative w-full max-w-lg border border-hairline bg-bg-elevated p-8">
        <div className="border-t-[3px] border-t-crimson" aria-hidden />
        <p className="label-sec mt-6">&#9656; SE INTERRUMPIÓ LA VOZ</p>

        <h2 className="display mt-4 text-2xl font-semibold text-ink">
          El jurado dejó de responder
        </h2>

        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Puede ser el micrófono, la conexión, o que el servicio de voz esté
          sin disponibilidad en este momento.
        </p>

        <p className="mt-4 text-[15px] leading-relaxed text-ink-muted">
          <span className="text-ink">No pierdes la sesión.</span> En modo texto
          el jurado es el mismo, con tu Red Team report cargado y el Chaos Event
          incluido. Solo escribes en vez de hablar.
        </p>

        {detalle !== null && detalle.length > 0 && (
          <p className="mt-5 border-l-2 border-hairline-strong bg-bg-input/60 px-4 py-2.5 font-mono text-[12px] leading-relaxed break-words text-ink-muted">
            {detalle}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onTexto}>
            Continuar en texto &rarr;
          </Button>
          <Button variant="outline" size="lg" onClick={onReintentar}>
            Reintentar con voz
          </Button>
          <Button variant="ghost" size="lg" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
