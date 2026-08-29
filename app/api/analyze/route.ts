import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { extractText, isSupported } from "@/lib/parse-ppt";

// El archivo pasa por aca en vez de ir directo del navegador a Convex porque
// la extraccion de texto necesita el runtime de Node (pdfjs). Una sola ida y
// vuelta: extrae, sube a storage y guarda la fila.

export const maxDuration = 60;

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const { getToken } = await auth();
  // Plantilla "convex": es la que emite el token con aud "convex".
  const token = await getToken({ template: "convex" });
  if (token === null) {
    return Response.json({ error: "No autenticado." }, { status: 401 });
  }

  const form = await req.formData();
  const sessionId = form.get("sessionId");
  const file = form.get("file");

  if (typeof sessionId !== "string" || !(file instanceof File)) {
    return Response.json(
      { error: "Faltan sessionId o file." },
      { status: 400 }
    );
  }
  if (file.size === 0) {
    return Response.json({ error: "El archivo esta vacio." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `El archivo supera los 20 MB (${(file.size / 1048576).toFixed(1)} MB).` },
      { status: 400 }
    );
  }
  if (!isSupported(file.type, file.name)) {
    return Response.json(
      { error: "Formato no soportado. Sube un PDF, PPTX o DOCX." },
      { status: 400 }
    );
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  convex.setAuth(token);

  const buffer = Buffer.from(await file.arrayBuffer());

  let extraction;
  try {
    extraction = await extractText(buffer, file.type, file.name);
  } catch (error) {
    return Response.json(
      {
        error: "No se pudo leer el archivo.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 422 }
    );
  }

  if (extraction.text.trim().length < 40) {
    return Response.json(
      {
        error:
          "El archivo no tiene texto legible. Si es un PDF escaneado, exportalo con texto seleccionable.",
      },
      { status: 422 }
    );
  }

  // Guardar el original: el After Action Report lo referencia.
  const uploadUrl = await convex.mutation(api.uploads.generateUploadUrl, {});
  const stored = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: new Uint8Array(buffer),
  });
  if (!stored.ok) {
    return Response.json(
      { error: `Convex storage rechazo el archivo (HTTP ${stored.status}).` },
      { status: 502 }
    );
  }
  const { storageId } = (await stored.json()) as { storageId: string };

  // Esta mutation agenda el Red Team.
  await convex.mutation(api.uploads.save, {
    sessionId: sessionId as Id<"sessions">,
    storageId: storageId as Id<"_storage">,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    extractedText: extraction.text,
    slideCount: extraction.unitCount ?? undefined,
  });

  return Response.json({
    ok: true,
    chars: extraction.text.length,
    unitCount: extraction.unitCount,
  });
}
