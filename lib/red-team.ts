import { z } from "zod";
import { PROMPTS } from "./prompts.generated";
import { generateJson } from "./llm";

// El contrato lo define prompts/red-team.md. Este schema es la red de
// seguridad: el LLM cumple el formato casi siempre, y cuando no, queremos
// fallar aca con un error legible y no escribir basura en Convex.

export const WEAKNESS_TYPES = [
  "unsupported_claim",
  "contradiction",
  "undefined_term",
  "narrative_gap",
  "weak_argument",
  "missing_evidence",
  "false_uniqueness",
] as const;

const score = z.number().min(0).max(100);

const weakness = z.object({
  type: z.enum(WEAKNESS_TYPES),
  severity: z.enum(["critical", "warning", "info"]),
  slide: z.string().nullish(),
  title: z.string().min(1),
  description: z.string().min(1),
  excerpt: z.string().nullish(),
});

const probableQuestion = z.object({
  probability: score,
  question: z.string().min(1),
  askedBy: z.string().min(1),
  riskLevel: z.enum(["high", "medium", "low"]),
  // El prompt lo llama relatedWeakness; el schema de Convex, relatedWeaknessIndex.
  relatedWeakness: z.union([z.number(), z.string()]).nullish(),
});

export const redTeamSchema = z.object({
  readinessScore: score,
  subscores: z.object({
    argumentation: score,
    evidence: score,
    narrative: score,
    defendability: score,
  }),
  weaknesses: z.array(weakness).min(1),
  probableQuestions: z.array(probableQuestion).min(1),
  summary: z.string().min(1),
});

export type RedTeamResult = z.infer<typeof redTeamSchema>;

export type RedTeamInput = {
  scenario: "hackathon" | "thesis" | "investor";
  goal: string;
  duration: number;
  extractedText: string;
  /** Criterio de evaluacion que subio el usuario, si lo subio. */
  rubric?: string;
};

/** Rellena el template de prompts/red-team.md con los datos de la sesion. */
export function buildUserPrompt(input: RedTeamInput): string {
  // La rubrica manda sobre los criterios genericos del prompt: si el usuario
  // sabe con que lo van a calificar, evaluar con otra cosa es ruido.
  const rubrica =
    input.rubric !== undefined && input.rubric.trim().length > 0
      ? "--- RUBRICA DE EVALUACION (provista por el usuario) ---\n" +
        input.rubric.trim() +
        "\n\nEvalua PRIORITARIAMENTE contra esta rubrica. Cuando una debilidad " +
        "incumpla un criterio de la rubrica, dilo explicitamente y nombra el " +
        "criterio. Los criterios genericos de tu system prompt son secundarios.\n\n"
      : "";

  return rubrica + PROMPTS.redTeam.userTemplate
    .replace("{scenario}", input.scenario)
    .replace("{goal}", input.goal || "(no especificado)")
    .replace("{duration}", String(input.duration))
    .replace("{extractedText}", input.extractedText);
}

export async function runRedTeam(input: RedTeamInput): Promise<RedTeamResult> {
  if (input.extractedText.trim().length < 40) {
    throw new Error(
      "El archivo no tiene texto suficiente para analizar. Puede ser un PDF de imagenes escaneadas."
    );
  }
  return await generateJson({
    system: PROMPTS.redTeam.system,
    prompt: buildUserPrompt(input),
    temperature: 0.4,
    maxOutputTokens: 4096,
    parse: (value) => redTeamSchema.parse(value),
  });
}

/** Normaliza al shape exacto que espera convex/schema.ts. */
export function toConvexShape(result: RedTeamResult) {
  return {
    readinessScore: Math.round(result.readinessScore),
    subscores: {
      argumentation: Math.round(result.subscores.argumentation),
      evidence: Math.round(result.subscores.evidence),
      narrative: Math.round(result.subscores.narrative),
      defendability: Math.round(result.subscores.defendability),
    },
    weaknesses: result.weaknesses.map((w) => ({
      type: w.type,
      severity: w.severity,
      slide: w.slide ?? undefined,
      title: w.title,
      description: w.description,
      excerpt: w.excerpt ?? undefined,
    })),
    probableQuestions: result.probableQuestions.map((q) => ({
      probability: Math.round(q.probability),
      question: q.question,
      askedBy: q.askedBy,
      riskLevel: q.riskLevel,
      relatedWeaknessIndex: toIndex(q.relatedWeakness),
    })),
    summary: result.summary,
  };
}

function toIndex(value: number | string | null | undefined): number | undefined {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  return undefined;
}
