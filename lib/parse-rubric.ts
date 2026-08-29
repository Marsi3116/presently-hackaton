import "server-only";

import { generateText } from "ai";
import { getModel } from "./llm";
import { extractText, isSupported } from "./parse-ppt";

export type RubricExtraction = {
  text: string;
  source: "image" | "document";
};

const IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

export function isImage(mimeType: string, filename: string): boolean {
  return IMAGE_MIME.has(mimeType) || /\.(png|jpe?g|webp|gif)$/i.test(filename);
}

export function isSupportedRubric(mimeType: string, filename: string): boolean {
  return isImage(mimeType, filename) || isSupported(mimeType, filename);
}

const VISION_SYSTEM = `Transcribes rubricas de evaluacion desde imagenes.

Devuelves SOLO el contenido de la rubrica como texto plano estructurado:
cada criterio en una linea, con su peso o puntaje si aparece.

No agregues comentarios, ni interpretaciones, ni markdown. Si la imagen no
contiene una rubrica ni criterios de evaluacion, responde exactamente:
SIN_RUBRICA`;

export async function extractRubric(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<RubricExtraction> {
  if (!isImage(mimeType, filename)) {
    const out = await extractText(buffer, mimeType, filename);
    return { text: out.text, source: "document" };
  }

  // Foto de la pizarra o del papel: la lee el modelo con vision.
  const { text } = await generateText({
    model: getModel("main"),
    system: VISION_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe la rubrica de esta imagen." },
          { type: "image", image: buffer, mediaType: mimeType || "image/png" },
        ],
      },
    ],
    maxOutputTokens: 1500,
  });

  const limpio = text.trim();
  if (limpio === "SIN_RUBRICA" || limpio.length === 0) {
    throw new Error(
      "No se reconocio una rubrica en la imagen. Prueba con una foto mas legible o sube el documento."
    );
  }
  return { text: limpio, source: "image" };
}
