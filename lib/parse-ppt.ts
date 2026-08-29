import "server-only";

// Extraccion de texto de PPT/PDF. Corre SOLO en el runtime de Node de Next
// (ver serverExternalPackages en next.config.ts), no en el de Convex: pdfjs
// necesita worker y filesystem.

export type Extraction = {
  text: string;
  /** Paginas en un PDF, slides en un PPTX. null si el formato no lo expone. */
  unitCount: number | null;
};

const PDF_MIME = new Set(["application/pdf"]);
const OFFICE_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.presentation",
]);

export function isSupported(mimeType: string, filename: string): boolean {
  if (PDF_MIME.has(mimeType) || OFFICE_MIME.has(mimeType)) return true;
  return /\.(pdf|pptx?|docx?|odp)$/i.test(filename);
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<Extraction> {
  const isPdf = PDF_MIME.has(mimeType) || /\.pdf$/i.test(filename);
  return isPdf ? await fromPdf(buffer) : await fromOffice(buffer);
}

async function fromPdf(buffer: Buffer): Promise<Extraction> {
  // pdf-parse v2 expone la clase PDFParse, no la funcion `pdf` de la v1.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: normalize(result.text), unitCount: result.total ?? null };
  } finally {
    // Sin destroy() queda vivo el worker de pdfjs y el proceso no termina.
    await parser.destroy();
  }
}

async function fromOffice(buffer: Buffer): Promise<Extraction> {
  // officeparser v7 devuelve un AST; el texto plano sale de ast.to("text").
  const { parseOffice } = await import("officeparser");
  const ast = await parseOffice(buffer);
  const text = normalize((await ast.to("text")).value);
  const pages = ast.metadata?.pages;
  return {
    text,
    unitCount: typeof pages === "number" ? pages : estimateBlocks(text),
  };
}

/** Colapsa el ruido de layout que dejan los extractores. */
function normalize(text: string): string {
  const limpio = text.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ");
  return collapse(markPages(limpio));
}

const PAGE_BREAK = /^[ \t]*--[ \t]*(\d+)[ \t]+of[ \t]+\d+[ \t]*--[ \t]*$/gim;

/**
 * pdf-parse cierra cada pagina con "-- 1 of 8 --", es decir DESPUES de su
 * contenido. Dejar el marcador ahi hacia que el modelo atribuyera cada bloque
 * al marcador anterior y citara siempre una pagina de menos: el claim de la
 * pagina 4 salia reportado como "Pagina 3".
 *
 * Se reordena para que el marcador ENCABECE el contenido que nombra.
 */
function markPages(text: string): string {
  const partes: string[] = [];
  let ultimo = 0;
  let hallado = false;

  for (const m of text.matchAll(PAGE_BREAK)) {
    hallado = true;
    const contenido = text.slice(ultimo, m.index).trim();
    if (contenido.length > 0) partes.push(`[Pagina ${m[1]}]\n${contenido}`);
    ultimo = m.index + m[0].length;
  }
  if (!hallado) return text;

  // Cola sin marcador: pdf-parse a veces omite el ultimo salto.
  const resto = text.slice(ultimo).trim();
  if (resto.length > 0) partes.push(`[Pagina ${partes.length + 1}]\n${resto}`);

  return partes.join("\n\n");
}

function collapse(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** Fallback cuando el formato no reporta paginas. Solo sirve para citar. */
function estimateBlocks(text: string): number | null {
  if (text.length === 0) return null;
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return blocks.length > 0 ? blocks.length : null;
}
