"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACEPTA_DECK = ".pdf,.pptx,.ppt,.docx,.doc,.odp";
const ACEPTA_RUBRICA = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp";

type Estado =
  | { fase: "vacio" }
  | { fase: "subiendo"; nombre: string }
  | { fase: "analizando"; nombre: string; aviso: string | null }
  | { fase: "error"; mensaje: string };

export function UploadDropzone({ sessionId }: { sessionId: Id<"sessions"> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rubricaRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "vacio" });
  const [arrastrando, setArrastrando] = useState(false);
  const [rubrica, setRubrica] = useState<File | null>(null);

  // Reactivo: el Red Team corre en background y cambia el status a "ready".
  const session = useQuery(api.sessions.get, { sessionId });
  const listo = session?.status === "ready";
  const falloAnalisis = session?.status === "failed";

  // Navegar durante el render rompe React. El Red Team termina en background
  // y useQuery reemite, asi que el efecto reacciona a ese cambio.
  useEffect(() => {
    if (listo && estado.fase === "analizando") {
      router.push(`/red-team/${sessionId}`);
    }
  }, [listo, estado.fase, router, sessionId]);

  async function subir(file: File) {
    setEstado({ fase: "subiendo", nombre: file.name });
    const body = new FormData();
    body.append("sessionId", sessionId);
    body.append("file", file);
    if (rubrica !== null) body.append("rubric", rubrica);
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = (await res.json()) as { error?: string; rubricStatus?: string | null };
      if (!res.ok) {
        setEstado({
          fase: "error",
          mensaje: data.error ?? `Fallo la subida (HTTP ${res.status}).`,
        });
        return;
      }
      setEstado({
        fase: "analizando",
        nombre: file.name,
        aviso: data.rubricStatus ?? null,
      });
    } catch {
      setEstado({ fase: "error", mensaje: "No se pudo contactar al servidor." });
    }
  }

  const ocupado = estado.fase === "subiendo" || estado.fase === "analizando";

  return (
    <div className="mt-10 space-y-8">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          const file = e.dataTransfer.files[0];
          if (file !== undefined && !ocupado) void subir(file);
        }}
        className={cn(
          "corner-ticks relative border border-dashed px-6 py-16 text-center transition-colors",
          arrastrando ? "border-crimson bg-crimson-dim/10" : "border-hairline-strong"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACEPTA_DECK}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file !== undefined) void subir(file);
          }}
        />

        {estado.fase === "vacio" && (
          <>
            <p className="label-meta">ARRASTRA TU PRESENTACION AQUI</p>
            <p className="mt-3 text-[15px] text-ink-soft">o</p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Elegir archivo
            </Button>
            <p className="mt-6 font-mono text-[11px] tracking-[0.15em] text-ink-muted uppercase">
              PDF &middot; PPTX &middot; DOCX &middot; MAX 20 MB
            </p>
          </>
        )}

        {estado.fase === "subiendo" && (
          <>
            <p className="label-sec">&#9656; EXTRAYENDO TEXTO</p>
            <p className="mt-3 font-mono text-[13px] text-ink-soft">{estado.nombre}</p>
          </>
        )}

        {estado.fase === "analizando" && !falloAnalisis && (
          <>
            <p className="label-sec">&#9656; RED TEAM EN CURSO</p>
            <p className="mt-3 text-[15px] text-ink">
              Buscando claims sin evidencia, contradicciones y huecos de narrativa.
            </p>
            <p className="mt-2 font-mono text-[11px] tracking-[0.15em] text-ink-muted uppercase">
              SUELE TARDAR 10-30 SEGUNDOS
            </p>
            {estado.aviso !== null && (
              <p className="mx-auto mt-5 max-w-md border-l-2 border-amber bg-amber-dim/15 px-4 py-2.5 text-left text-[13px] text-ink-soft">
                {estado.aviso}
              </p>
            )}
          </>
        )}

        {(estado.fase === "error" || falloAnalisis) && (
          <>
            <p className="label-sec">&#9656; FALLO</p>
            <p className="mt-3 text-[15px] text-ink">
              {estado.fase === "error"
                ? estado.mensaje
                : "El analisis no pudo completarse. Revisa el archivo e intenta de nuevo."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              onClick={() => {
                setEstado({ fase: "vacio" });
                inputRef.current?.click();
              }}
            >
              Intentar con otro archivo
            </Button>
          </>
        )}
      </div>

      {/* Rubrica: opcional pero es lo que mas sube la calidad del analisis,
          porque deja de evaluar contra criterios genericos. */}
      {!ocupado && (
        <div className="border border-hairline bg-bg-elevated p-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="label-meta">RUBRICA DE EVALUACION</p>
            <span className="font-mono text-[10px] tracking-[0.15em] text-teal uppercase">
              OPCIONAL &middot; RECOMENDADO
            </span>
          </div>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-muted">
            Si tienes las bases del hackathon, la rubrica del profesor o los
            criterios del comite, subelos. El red team y el jurado evaluan
            contra <span className="text-ink-soft">esos</span> criterios en vez
            de los genericos. Sirve una foto de la pizarra: la leemos con vision.
          </p>

          <input
            ref={rubricaRef}
            type="file"
            accept={ACEPTA_RUBRICA}
            className="sr-only"
            onChange={(e) => setRubrica(e.target.files?.[0] ?? null)}
          />

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => rubricaRef.current?.click()}
            >
              {rubrica === null ? "Adjuntar rubrica" : "Cambiar"}
            </Button>
            {rubrica !== null && (
              <>
                <span className="font-mono text-[12px] text-teal">
                  &#9656; {rubrica.name}
                </span>
                <button
                  type="button"
                  className="label-meta transition-colors hover:text-crimson"
                  onClick={() => {
                    setRubrica(null);
                    if (rubricaRef.current !== null) rubricaRef.current.value = "";
                  }}
                >
                  QUITAR
                </button>
              </>
            )}
          </div>
          <p className="mt-4 font-mono text-[11px] tracking-[0.15em] text-ink-muted uppercase">
            PDF &middot; DOCX &middot; PNG &middot; JPG
          </p>
        </div>
      )}
    </div>
  );
}
