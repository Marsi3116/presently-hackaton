// Genera material de prueba en samples/.
//
//   node scripts/make-samples.mjs
//
// El deck tiene fallas PLANTADAS a proposito, una por cada tipo de debilidad
// que detecta prompts/red-team.md. Sirve para verificar que el analisis
// encuentra lo que tiene que encontrar, en vez de inventar.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

mkdirSync("samples", { recursive: true });

// ---------------------------------------------------------------- PDF

/** Escapa lo que PDF trata como sintaxis dentro de un string literal. */
const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function crc32(buf) {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  let c = 0xffffffff;
  for (const b of buf) c = t[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** paginas: [{ titulo, lineas: [] }] */
function makePdf(paginas) {
  const objetos = [];
  const push = (s) => objetos.push(s) - 1;

  const nPages = paginas.length;
  const kids = paginas.map((_, i) => `${4 + i * 2} 0 R`).join(" ");

  push("<</Type/Catalog/Pages 2 0 R>>");
  push(`<</Type/Pages/Kids[${kids}]/Count ${nPages}>>`);
  push("<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>");

  for (const p of paginas) {
    const partes = [`BT /F1 26 Tf 60 720 Td (${esc(p.titulo)}) Tj ET`];
    let y = 660;
    for (const linea of p.lineas) {
      partes.push(`BT /F1 13 Tf 60 ${y} Td (${esc(linea)}) Tj ET`);
      y -= 26;
    }
    const contenido = partes.join("\n");
    const idxContenido = objetos.length + 1;
    push(
      `<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]` +
        `/Resources<</Font<</F1 3 0 R>>>>/Contents ${idxContenido + 1} 0 R>>`
    );
    push(`<</Length ${Buffer.byteLength(contenido, "latin1")}>>\nstream\n${contenido}\nendstream`);
  }

  let out = "%PDF-1.4\n";
  const offsets = [];
  objetos.forEach((cuerpo, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, "0")} 00000 n \n`;
  out += `trailer<</Size ${objetos.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

// ------------------------------------------------------- deck con fallas

const DECK = [
  {
    titulo: "FlowState",
    lineas: [
      "La IA que le devuelve el foco a tu equipo",
      "",
      "The Next Craft 2026 - Track Out of the Box",
    ],
  },
  {
    // FALLA: unsupported_claim. Dos cifras duras sin ninguna fuente.
    titulo: "El problema",
    lineas: [
      "El 87% de los equipos remotos pierde 3 horas diarias",
      "coordinandose en vez de construir.",
      "",
      "Las herramientas actuales suman ruido en lugar de quitarlo.",
    ],
  },
  {
    // FALLA: undefined_term. Jerga sin definir en su primera aparicion.
    titulo: "La solucion",
    lineas: [
      "FlowState usa RAG agentico multimodal sobre un grafo de",
      "contexto para orquestar el trabajo del equipo en tiempo real.",
      "",
      "Nuestro motor de inferencia semantica prioriza tareas solo.",
    ],
  },
  {
    // FALLA: unsupported_claim + missing_evidence. Sin metodologia ni baseline.
    titulo: "Traccion",
    lineas: [
      "Reducimos el tiempo de reuniones un 43%.",
      "",
      "Tenemos 200 usuarios en beta cerrada.",
      "El feedback ha sido excelente.",
    ],
  },
  {
    // FALLA: false_uniqueness. Notion, Linear y Asana existen y compiten.
    titulo: "Competencia",
    lineas: [
      "Somos los unicos en el mercado haciendo esto.",
      "",
      "No existe ninguna herramienta que combine coordinacion",
      "e inteligencia contextual como la nuestra.",
    ],
  },
  {
    // FALLA: contradiction. La pagina 4 dijo 200 usuarios en beta.
    titulo: "Modelo de negocio",
    lineas: [
      "Freemium con plan premium para empresas.",
      "",
      "Con miles de usuarios activos ya monetizando, el camino",
      "a rentabilidad es claro.",
    ],
  },
  {
    // FALLA: narrative_gap. Nunca se explica como funciona ni hay demo.
    titulo: "Equipo",
    lineas: [
      "Somos 4 estudiantes apasionados por la productividad.",
      "",
      "Construimos esto en 12 horas.",
    ],
  },
  {
    titulo: "Lo que pedimos",
    lineas: [
      "Queremos el primer lugar de este hackathon.",
      "",
      "Y despues, levantar una ronda pre-semilla.",
    ],
  },
];

writeFileSync("samples/deck-demo.pdf", makePdf(DECK));
console.log("samples/deck-demo.pdf        8 paginas, 7 fallas plantadas");

// ------------------------------------------------------------- rubrica

const RUBRICA = [
  {
    titulo: "Rubrica de evaluacion",
    lineas: [
      "The Next Craft 2026 - Track Out of the Box",
      "",
      "Innovacion y originalidad                        30%",
      "  La idea resuelve algo que nadie mas resuelve.",
      "",
      "Viabilidad tecnica demostrada                    25%",
      "  Hay demo funcional, no mockup. Corre en vivo.",
      "",
      "Uso de Convex como backend                       20%",
      "  Requisito del sponsor. Datos, storage y funciones.",
      "",
      "Claridad de la presentacion                      15%",
      "  Se entiende el problema en los primeros 30 segundos.",
      "",
      "Impacto y potencial de mercado                   10%",
      "  Numeros con fuente, no estimaciones.",
    ],
  },
];

writeFileSync("samples/rubrica-demo.pdf", makePdf(RUBRICA));
console.log("samples/rubrica-demo.pdf     documento, 5 criterios con pesos");

// --------------------------------------------- rubrica como foto (vision)

const FONT = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [31, 4, 4, 4, 4, 4, 31], J: [1, 1, 1, 1, 17, 17, 14],
  K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14], V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  "0": [14, 17, 19, 21, 25, 17, 14], "1": [4, 12, 4, 4, 4, 4, 14],
  "2": [14, 17, 1, 2, 4, 8, 31], "3": [31, 2, 4, 2, 1, 17, 14],
  "4": [2, 6, 10, 18, 31, 2, 2], "5": [31, 16, 30, 1, 1, 17, 14],
  "6": [6, 8, 16, 30, 17, 17, 14], "7": [31, 1, 2, 4, 8, 8, 8],
  "8": [14, 17, 17, 14, 17, 17, 14], "9": [14, 17, 17, 15, 1, 2, 12],
  "%": [17, 1, 2, 4, 8, 16, 17], ":": [0, 4, 0, 0, 0, 4, 0],
  "-": [0, 0, 0, 31, 0, 0, 0], ".": [0, 0, 0, 0, 0, 4, 4],
  " ": [0, 0, 0, 0, 0, 0, 0],
};

function makePng(lineas) {
  const S = 3, W = 620, H = 60 + lineas.length * 34;
  const px = Buffer.alloc(W * H * 3, 250);
  const set = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    px[i] = 25; px[i + 1] = 25; px[i + 2] = 25;
  };
  lineas.forEach((linea, n) => {
    let cx = 24;
    const oy = 24 + n * 34;
    for (const ch of linea.toUpperCase()) {
      const g = FONT[ch];
      if (g !== undefined) {
        for (let r = 0; r < 7; r++)
          for (let c = 0; c < 5; c++)
            if ((g[r] >> (4 - c)) & 1)
              for (let a = 0; a < S; a++)
                for (let b = 0; b < S; b++) set(cx + c * S + a, oy + r * S + b);
      }
      cx += 6 * S;
    }
  });

  const raw = Buffer.alloc(H * (W * 3 + 1));
  for (let y = 0; y < H; y++) {
    raw[y * (W * 3 + 1)] = 0;
    px.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const chunk = (tipo, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(tipo), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(
  "samples/rubrica-demo.png",
  makePng([
    "RUBRICA - THE NEXT CRAFT 2026",
    "",
    "INNOVACION Y ORIGINALIDAD      30%",
    "VIABILIDAD TECNICA DEMOSTRADA  25%",
    "USO DE CONVEX COMO BACKEND     20%",
    "CLARIDAD DE LA PRESENTACION    15%",
    "IMPACTO Y MERCADO              10%",
  ])
);
console.log("samples/rubrica-demo.png     foto, para probar el camino de vision");
