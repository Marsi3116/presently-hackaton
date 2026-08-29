"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACEPTA = ".pdf,.pptx,.ppt,.docx,.doc,.odp";

type Estado =
  | { fase: "vacio" }
  | { fase: "subiendo"; nombre: string }
  | { fase: "analizando"; nombre: string }
  | { fase: "error"; mensaje: string };

export function UploadDropzone({ sessionId }: { sessionId: Id<"sessions"> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "vacio" });
  const [arrastrando, setArrastrando] = useState(false);

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
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = (await res.json()) as { error?: string; detail?: string };
      if (!res.ok) {
        setEstado({
          fase: "error",
          mensaje: data.error ?? `Fallo la subida (HTTP ${res.status}).`,
        });
        return;
      }
      setEstado({ fase: "analizando", nombre: file.name });
    } catch {
      setEstado({ fase: "error", mensaje: "No se pudo contactar al servidor." });
    }
  }

  const ocupado = estado.fase === "subiendo" || estado.fase === "analizando";

  return (
    <div className="mt-10">
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
          accept={ACEPTA}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file !== undefined) void subir(file);
          }}
        />

        {estado.fase === "vacio" && (
          <>
            <p className="label-meta">ARRASTRA EL ARCHIVO AQUÍ</p>
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
              PDF · PPTX · DOCX &middot; MÁX 20 MB
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
          </>
        )}

        {(estado.fase === "error" || falloAnalisis) && (
          <>
            <p className="label-sec">&#9656; FALLÓ</p>
            <p className="mt-3 text-[15px] text-ink">
              {estado.fase === "error"
                ? estado.mensaje
                : "El análisis no pudo completarse. Revisa el archivo e intenta de nuevo."}
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
    </div>
  );
}
