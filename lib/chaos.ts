import { z } from "zod";
import { PROMPTS } from "./prompts.generated";
import { generateJson } from "./llm";
import { findCompetitor, type Competitor } from "./tavily";

const chaosSchema = z.object({
  headline: z.string().min(1),
  body: z.string().min(1),
  callToAction: z.string().min(1),
});

export type ChaosMessage = z.infer<typeof chaosSchema> & {
  competitorName: string;
  competitorDescription: string;
  tavilyUsed: boolean;
};

export async function buildChaosEvent(
  pitchSummary: string,
  scenario: "hackathon" | "thesis" | "investor"
): Promise<ChaosMessage> {
  const competitor: Competitor = await findCompetitor(pitchSummary, scenario);

  const prompt = PROMPTS.chaosCompetitor.userTemplate
    .replace("{competitorName}", competitor.name)
    .replace("{competitorDescription}", competitor.description)
    .replace("{pitchSummary}", pitchSummary)
    .replace("{scenario}", scenario);

  const message = await generateJson({
    system: PROMPTS.chaosCompetitor.system,
    prompt,
    temperature: 0.8,
    maxOutputTokens: 512,
    parse: (value) => chaosSchema.parse(value),
  });

  return {
    ...message,
    competitorName: competitor.name,
    competitorDescription: competitor.description,
    tavilyUsed: competitor.fromSearch,
  };
}
