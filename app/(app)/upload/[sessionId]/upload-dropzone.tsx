"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACEPTA_DECK = ".pdf,.pptx,.ppt,.docx,.doc,.odp";
const ACEPTA_RUBRICA = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp";
const MAX_BYTES = 50 * 1024 * 1024;

type Estado =
  | { fase: "vacio" }
  | { fase: "subiendo"; nombre: string; detalle: string }
  | { fase: "analizando"; nombre: string; aviso: string | null }
  | { fase: "error"; mensaje: string };

export function UploadDropzone({ sessionId }: { sessionId: Id<"sessions"> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rubricaRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "vacio" });
  const [arrastrando, setArrastrando] = useState(false);
  const [rubrica, setRubrica] = useState<File | null>(null);

  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);

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

  /** Sube un archivo DIRECTO a Convex y devuelve su storageId. */
  async function aStorage(file: File) {
    const url = await generateUploadUrl();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) throw new Error(`Convex Storage devolvio HTTP ${res.status}.`);
    const { storageId } = (await res.json()) as { storageId: string };
    return {
      storageId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
    };
  }

  async function subir(file: File) {
    if (file.size === 0) {
      setEstado({ fase: "error", mensaje: "El archivo esta vacio." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setEstado({
        fase: "error",
        mensaje: `El archivo pesa ${(file.size / 1048576).toFixed(1)} MB y el maximo son 50 MB.`,
      });
      return;
    }

    try {
      // El archivo va del navegador a Convex sin pasar por Vercel, que corta
      // los bodies en 4.5 MB. Un PPT con imagenes pasa eso facil.
      setEstado({ fase: "subiendo", nombre: file.name, detalle: "SUBIENDO ARCHIVO" });
      const deck = await aStorage(file);

      let rubricaSubida = null;
      if (rubrica !== null) {
        setEstado({ fase: "subiendo", nombre: file.name, detalle: "SUBIENDO RUBRICA" });
        rubricaSubida = await aStorage(rubrica);
      }

      setEstado({ fase: "subiendo", nombre: file.name, detalle: "EXTRAYENDO TEXTO" });
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, deck, rubric: rubricaSubida }),
      });
      const data = (await res.json()) as {
        error?: string;
        detail?: string;
        rubricStatus?: string | null;
      };
      if (!res.ok) {
        setEstado({
          fase: "error",
          mensaje: data.error ?? `Fallo el analisis (HTTP ${res.status}).`,
        });
        return;
      }
      setEstado({
        fase: "analizando",
        nombre: file.name,
        aviso: data.rubricStatus ?? null,
      });
    } catch (e) {
      setEstado({
        fase: "error",
        mensaje: e instanceof Error ? e.message : "No se pudo subir el archivo.",
      });
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
              PDF &middot; PPTX &middot; DOCX &middot; MAX 50 MB
            </p>
          </>
        )}

        {estado.fase === "subiendo" && (
          <>
            <p className="label-sec">&#9656; {estado.detalle}</p>
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
            <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-ink">
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
