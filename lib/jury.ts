export type Scenario = "hackathon" | "thesis" | "investor";

export const JURADOS: Record<
  Scenario,
  { name: string; role: string; assistantEnv: string }
> = {
  hackathon: {
    name: "Alex Ruiz",
    role: "Product Manager senior · 50+ hackathons como jurado",
    assistantEnv: "hackathon",
  },
  thesis: {
    name: "Dra. María Carrasco",
    role: "Profesora titular · comité de tesis",
    assistantEnv: "thesis",
  },
  investor: {
    name: "Carlos Berenstein",
    role: "Partner en fondo de VC",
    assistantEnv: "investor",
  },
};

/** Los NEXT_PUBLIC_ se inlinean en build, asi que no admiten indice dinamico. */
export function assistantIdFor(scenario: Scenario): string | undefined {
  switch (scenario) {
    case "hackathon":
      return process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_HACKATHON;
    case "thesis":
      return process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_THESIS;
    case "investor":
      return process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID_INVESTOR;
  }
}
