import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";

// Abstraccion de proveedor. Todo el codigo de la app llama a estas funciones,
// nunca a un SDK directo, para que cambiar de Claude a GPT sea una env var.

type Speed = "main" | "fast";

function provider(): "anthropic" | "openai" {
  const raw = (process.env.LLM_PROVIDER ?? "anthropic").trim().toLowerCase();
  if (raw === "anthropic" || raw === "openai") return raw;
  throw new Error(
    `LLM_PROVIDER invalido: "${raw}". Valores aceptados: "anthropic" | "openai".`
  );
}

export function getModel(speed: Speed = "main"): LanguageModel {
  if (provider() === "anthropic") {
    const id =
      speed === "fast"
        ? (process.env.ANTHROPIC_MODEL_FAST ?? "claude-haiku-4-5")
        : (process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5");
    return anthropic(id);
  }
  const id =
    speed === "fast"
      ? (process.env.OPENAI_MODEL_FAST ?? "gpt-4o-mini")
      : (process.env.OPENAI_MODEL ?? "gpt-4o");
  return openai(id);
}

export type GenerateArgs = {
  system: string;
  prompt: string;
  speed?: Speed;
  temperature?: number;
  maxOutputTokens?: number;
};

export async function generateResponse({
  system,
  prompt,
  speed = "main",
  temperature = 0.7,
  maxOutputTokens = 1024,
}: GenerateArgs): Promise<string> {
  const { text } = await generateText({
    model: getModel(speed),
    system,
    prompt,
    temperature,
    maxOutputTokens,
  });
  return text;
}

/**
 * Igual que generateResponse pero exige JSON.
 *
 * No usamos generateObject: los prompts de prompts/*.md ya definen el schema
 * en lenguaje natural y estan afinados. Reescribirlos como schema del SDK
 * duplicaria la fuente de verdad. Validamos aca con el parser que reciba.
 */
export async function generateJson<T>({
  system,
  prompt,
  parse,
  speed = "main",
  temperature = 0.4,
  maxOutputTokens = 4096,
}: GenerateArgs & { parse: (value: unknown) => T }): Promise<T> {
  const raw = await generateResponse({
    system,
    prompt,
    speed,
    temperature,
    maxOutputTokens,
  });

  let candidate: unknown;
  try {
    candidate = JSON.parse(stripFence(raw));
  } catch {
    throw new Error(
      `El modelo no devolvio JSON valido. Primeros 300 caracteres:\n${raw.slice(0, 300)}`
    );
  }
  return parse(candidate);
}

/** Los modelos suelen envolver el JSON en ```json aunque se les pida que no. */
function stripFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
}
