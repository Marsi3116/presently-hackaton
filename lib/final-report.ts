import { z } from "zod";
import { PROMPTS } from "./prompts.generated";
import { generateJson } from "./llm";

const score = z.number().min(0).max(100);

const timelineEntry = z.object({
  timestamp: z.union([z.string(), z.number()]),
  type: z.string(),
  severity: z.enum(["ok", "info", "warning", "critical"]).catch("info"),
  title: z.string().min(1),
  detail: z.unknown().nullish(),
});

const reportSchema = z.object({
  overallScore: score,
  subscores: z.object({
    content: score,
    argumentation: score,
    evidence: score,
    communication: score,
    timeManagement: score,
    qaHandling: score,
    chaosResponse: score,
  }),
  summary: z.string().min(1),
  timeline: z.array(timelineEntry).default([]),
  keyWins: z.array(z.string()).default([]),
  keyMisses: z.array(z.string()).default([]),
  recommendations: z
    .array(
      z.object({
        priority: z.enum(["high", "medium", "low"]).catch("medium"),
        title: z.string().min(1),
        detail: z.string().default(""),
      })
    )
    .default([]),
});

export type FinalReport = z.infer<typeof reportSchema>;

export type ReportInput = {
  scenario: string;
  goal: string;
  duration: number;
  /** Texto del material subido, para medir que tanto de eso llego a decirse. */
  deckText?: string;
  redTeamReportJson: string;
  presentationTranscript: string;
  qaHistory: string;
  chaosMessage: string;
  chaosResponse: string;
};

export async function runFinalReport(input: ReportInput): Promise<FinalReport> {
  const prompt = PROMPTS.finalReport.userTemplate
    .replace("{scenario}", input.scenario)
    .replace("{goal}", input.goal)
    .replace("{duration}", String(input.duration))
    .replace("{redTeamReportJson}", input.redTeamReportJson)
    .replace("{presentationTranscript}", input.presentationTranscript || "(sin transcripcion)")
    .replace("{qaHistory}", input.qaHistory || "(sin Q&A)")
    .replace("{chaosMessage}", input.chaosMessage || "(no ocurrio)")
    .replace("{chaosResponse}", input.chaosResponse || "(sin respuesta)");

  return await generateJson({
    system: PROMPTS.finalReport.system + COBERTURA,
    prompt: prompt + bloqueDeck(input.deckText),
    temperature: 0.4,
    maxOutputTokens: 4096,
    parse: (value) => reportSchema.parse(value),
  });
}

/**
 * Instruccion extra: sin esto el reporte evalua solo lo que se dijo y nunca
 * nota que media presentacion quedo sin exponer, que es un problema real en
 * una defensa con tiempo limitado.
 */
const COBERTURA = `

COBERTURA DEL MATERIAL:
Ademas de evaluar lo que dijo, compara la TRANSCRIPCION contra el CONTENIDO
DEL MATERIAL. Si el presentador omitio secciones importantes del material, o
si lo que expuso no corresponde con lo que el material dice, marcalo
explicitamente en keyMisses y en una recomendacion de prioridad alta,
nombrando la slide o seccion que quedo sin cubrir.
Si la transcripcion esta vacia o es muy corta, dilo en el summary en vez de
inventar una evaluacion.`;

function bloqueDeck(deckText: string | undefined): string {
  if (deckText === undefined || deckText.trim().length === 0) return "";
  return "\n\n--- CONTENIDO DEL MATERIAL SUBIDO ---\n" + deckText;
}

/** "03:17" -> 197 segundos. El schema de Convex guarda numeros. */
export function toSeconds(stamp: string | number): number {
  if (typeof stamp === "number") return Math.max(0, Math.round(stamp));
  const parts = stamp.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

const TIMELINE_TYPES = new Set([
  "start",
  "slide_change",
  "content_delivery",
  "critical_moment",
  "qa_start",
  "jury_question",
  "user_response",
  "chaos_event",
  "end",
]);

/** El schema de Convex usa un union cerrado; lo que no encaje va a info. */
export function normalizeTimelineType(type: string): string {
  return TIMELINE_TYPES.has(type) ? type : "content_delivery";
}
