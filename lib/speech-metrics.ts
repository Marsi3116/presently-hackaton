// Analisis de la forma de hablar, sobre la transcripcion.
//
// No usa audio: todo sale del texto y de los tiempos que ya guardamos en
// transcripts. Barato, y suficiente para lo que el reporte necesita decir.

/**
 * Muletillas del espanol hablado. Se cuentan como palabra suelta para no
 * marcar "esteban" al buscar "este", ni "bueno" dentro de "buenos dias".
 */
const MULETILLAS = [
  "eh", "ehh", "em", "este", "esto", "mmm", "hmm", "aja",
  "o sea", "osea", "digamos", "como que", "tipo", "verdad",
  "no se", "nose", "bueno", "entonces bueno", "y nada",
  "basicamente", "literalmente", "obviamente",
];

export type SpeechMetrics = {
  words: number;
  durationSec: number;
  wordsPerMinute: number;
  /** Muletillas por cada 100 palabras: comparable entre discursos de distinto largo. */
  fillerRate: number;
  fillers: Array<{ term: string; count: number }>;
  /** Silencios de mas de 2 segundos entre segmentos. */
  pauseCount: number;
  longestPauseSec: number;
  pace: "lento" | "adecuado" | "rapido";
};

export type Segment = {
  text: string;
  startTimestamp: number;
  endTimestamp: number;
};

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeSpeech(segments: Segment[]): SpeechMetrics | null {
  if (segments.length === 0) return null;

  const orden = [...segments].sort((a, b) => a.startTimestamp - b.startTimestamp);
  const texto = normalizar(orden.map((s) => s.text).join(" "));
  const words = texto.length === 0 ? 0 : texto.split(" ").length;
  if (words === 0) return null;

  const inicio = orden[0].startTimestamp;
  const fin = orden[orden.length - 1].endTimestamp;
  // Si los timestamps no sirven, se estima a un ritmo normal de habla.
  const durationSec = Math.max(1, fin - inicio || Math.round((words / 130) * 60));

  const fillers: Array<{ term: string; count: number }> = [];
  for (const m of MULETILLAS) {
    const patron = new RegExp(`(?<![\\p{L}])${m.replace(/ /g, "\\s+")}(?![\\p{L}])`, "giu");
    const count = (texto.match(patron) ?? []).length;
    if (count > 0) fillers.push({ term: m, count });
  }
  fillers.sort((a, b) => b.count - a.count);
  const totalFillers = fillers.reduce((n, f) => n + f.count, 0);

  let pauseCount = 0;
  let longestPauseSec = 0;
  for (let i = 1; i < orden.length; i++) {
    const hueco = orden[i].startTimestamp - orden[i - 1].endTimestamp;
    if (hueco >= 2) {
      pauseCount++;
      longestPauseSec = Math.max(longestPauseSec, Math.round(hueco));
    }
  }

  const wordsPerMinute = Math.round((words / durationSec) * 60);
  // Rangos de referencia para exposicion en espanol: bajo 110 se arrastra,
  // sobre 165 el oyente pierde el hilo.
  const pace =
    wordsPerMinute < 110 ? "lento" : wordsPerMinute > 165 ? "rapido" : "adecuado";

  return {
    words,
    durationSec,
    wordsPerMinute,
    fillerRate: Math.round((totalFillers / words) * 1000) / 10,
    fillers: fillers.slice(0, 5),
    pauseCount,
    longestPauseSec,
    pace,
  };
}

/** Resumen en texto para inyectar en el prompt del reporte final. */
export function describeSpeech(m: SpeechMetrics | null): string {
  if (m === null) return "";
  const lista =
    m.fillers.length > 0
      ? m.fillers.map((f) => `"${f.term}" x${f.count}`).join(", ")
      : "ninguna detectada";
  return [
    "\n--- FORMA DE HABLAR (medida sobre la transcripcion) ---",
    `Palabras: ${m.words} en ${m.durationSec}s`,
    `Ritmo: ${m.wordsPerMinute} palabras por minuto (${m.pace})`,
    `Muletillas: ${m.fillerRate} por cada 100 palabras. ${lista}`,
    `Pausas largas (>2s): ${m.pauseCount}, la mas larga de ${m.longestPauseSec}s`,
    "Usa estos datos en el subscore de comunicacion. Son medidos, no los inventes.",
  ].join("\n");
}
