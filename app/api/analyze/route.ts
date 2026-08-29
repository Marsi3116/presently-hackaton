import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { extractText, isSupported } from "@/lib/parse-ppt";
import { extractRubric, isSupportedRubric } from "@/lib/parse-rubric";

// El navegador sube los archivos DIRECTO a Convex Storage y aca solo llegan
// los storageId. El archivo nunca pasa por el body de esta funcion: Vercel lo
// corta en 4.5 MB y un PPT con imagenes pasa eso facil (el de prueba pesaba
// 14 MB). El servidor los baja de Convex, que no tiene ese limite.
//
// La extraccion sigue del lado del servidor porque pdfjs necesita el runtime
// de Node, que el navegador no tiene.

export const maxDuration = 60;

type Entrada = {
  sessionId?: unknown;
  deck?: unknown;
  rubric?: unknown;
};

type Archivo = {
  storageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

function leerArchivo(valor: unknown): Archivo | null {
  if (typeof valor !== "object" || valor === null) return null;
  const v = valor as Record<string, unknown>;
  if (
    typeof v.storageId !== "string" ||
    typeof v.filename !== "string" ||
    typeof v.mimeType !== "string" ||
    typeof v.sizeBytes !== "number"
  ) {
    return null;
  }
  return {
    storageId: v.storageId,
    filename: v.filename,
    mimeType: v.mimeType,
    sizeBytes: v.sizeBytes,
  };
}

export async function POST(req: Request) {
  const { getToken } = await auth();
  // Plantilla "convex": es la que emite el token con aud "convex".
  const token = await getToken({ template: "convex" });
  if (token === null) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  const body: unknown = await req.json();
  const entrada = (body ?? {}) as Entrada;
  const sessionId = entrada.sessionId;
  const deck = leerArchivo(entrada.deck);

  if (typeof sessionId !== "string" || deck === null) {
    return Response.json(
      { error: "Faltan sessionId o los datos del archivo." },
      { status: 400 }
    );
  }
  if (!isSupported(deck.mimeType, deck.filename)) {
    return Response.json(
      { error: "Formato no soportado. Sube un PDF, PPTX o DOCX." },
      { status: 400 }
    );
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(token);

  const descartar = (storageId: string) =>
    convex
      .mutation(api.uploads.discard, { storageId: storageId as Id<"_storage"> })
      .catch(() => {});

  let buffer: Buffer;
  try {
    buffer = await bajar(convex, deck.storageId);
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo recuperar el archivo subido.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 }
    );
  }

  let extraction;
  try {
    extraction = await extractText(buffer, deck.mimeType, deck.filename);
  } catch (error) {
    await descartar(deck.storageId);
    return Response.json(
      {
        error: "No se pudo leer el archivo.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 422 }
    );
  }

  if (extraction.text.trim().length < 40) {
    await descartar(deck.storageId);
    return Response.json(
      {
        error:
          "El archivo no tiene texto legible. Si las slides son imagenes o el PDF es un escaneo, exportalo con texto seleccionable.",
      },
      { status: 422 }
    );
  }

  // La rubrica es opcional y se procesa ANTES del deck, porque uploads.save
  // agenda el Red Team y el analisis tiene que encontrarla ya guardada.
  const rubric = leerArchivo(entrada.rubric);
  let rubricStatus: string | null = null;
  if (rubric !== null) {
    if (!isSupportedRubric(rubric.mimeType, rubric.filename)) {
      rubricStatus = "Formato de rubrica no soportado; se ignoro.";
      await descartar(rubric.storageId);
    } else {
      try {
        const rBuf = await bajar(convex, rubric.storageId);
        const parsed = await extractRubric(rBuf, rubric.mimeType, rubric.filename);
        await convex.mutation(api.rubrics.save, {
          sessionId: sessionId as Id<"sessions">,
          storageId: rubric.storageId as Id<"_storage">,
          filename: rubric.filename,
          mimeType: rubric.mimeType,
          sizeBytes: rubric.sizeBytes,
          extractedText: parsed.text,
          source: parsed.source,
        });
      } catch (error) {
        // La rubrica es opcional: si falla, el analisis sigue sin ella.
        rubricStatus =
          error instanceof Error ? error.message : "No se pudo leer la rubrica.";
        await descartar(rubric.storageId);
      }
    }
  }

  // Esta mutation agenda el Red Team.
  await convex.mutation(api.uploads.save, {
    sessionId: sessionId as Id<"sessions">,
    storageId: deck.storageId as Id<"_storage">,
    filename: deck.filename,
    mimeType: deck.mimeType,
    sizeBytes: deck.sizeBytes,
    extractedText: extraction.text,
    slideCount: extraction.unitCount ?? undefined,
  });

  return Response.json({
    ok: true,
    chars: extraction.text.length,
    unitCount: extraction.unitCount,
    rubricStatus,
  });
}

async function bajar(convex: ConvexHttpClient, storageId: string): Promise<Buffer> {
  const url = await convex.query(api.uploads.getStorageUrl, {
    storageId: storageId as Id<"_storage">,
  });
  if (url === null) throw new Error("El archivo no existe en storage.");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Storage devolvio HTTP ${res.status}.`);
  return Buffer.from(await res.arrayBuffer());
}
