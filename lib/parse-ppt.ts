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
  return (
    text
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+/g, " ")
      // pdf-parse separa paginas con "-- 1 of 8 --". Lo reescribimos a un
      // marcador explicito: el Red Team tiene que citar "Pagina 4", y sin esta
      // senal el LLM inventa los numeros.
      .replace(/^[ \t]*--[ \t]*(\d+)[ \t]+of[ \t]+\d+[ \t]*--[ \t]*$/gim, "\n[Pagina $1]\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

/** Fallback cuando el formato no reporta paginas. Solo sirve para citar. */
function estimateBlocks(text: string): number | null {
  if (text.length === 0) return null;
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim().length > 0);
  return blocks.length > 0 ? blocks.length : null;
}
