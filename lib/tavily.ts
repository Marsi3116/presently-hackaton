// Sin "server-only": este modulo tambien corre dentro de una Convex action,
// donde ese import no resuelve.

import { generateResponse } from "./llm";

export type Competitor = {
  name: string;
  description: string;
  /** false cuando se uso la lista de respaldo en vez de una busqueda real. */
  fromSearch: boolean;
};

// Del bloque "Fallback si Tavily falla" de prompts/chaos-competitor.md.
const FALLBACK: Record<string, Omit<Competitor, "fromSearch">> = {
  hackathon: {
    name: "Yoodli",
    description: "AI communication coach with real-time feedback",
  },
  thesis: {
    name: "un paper reciente en tu campo",
    description: "recent competing publication",
  },
  investor: {
    name: "Poised",
    description: "Well-funded AI presentation coach with enterprise deals",
  },
};

type SearchHit = { title: string; content: string; url: string };

/**
 * Busca un competidor real. Nunca lanza: el Chaos Event es el momento WOW de
 * la demo y no puede caerse porque Tavily tardo o quedo sin cuota.
 */
export async function findCompetitor(
  pitchSummary: string,
  scenario: string
): Promise<Competitor> {
  const hits = await search(pitchSummary);
  if (hits.length === 0) return { ...fallbackFor(scenario), fromSearch: false };

  const named = await pickCompetitor(hits, pitchSummary);
  if (named === null) return { ...fallbackFor(scenario), fromSearch: false };
  return { ...named, fromSearch: true };
}

async function search(pitchSummary: string): Promise<SearchHit[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (apiKey === undefined || apiKey.length === 0 || apiKey.endsWith("...")) {
    return [];
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        // Pedir el producto y no "los mejores X" reduce, sin eliminar, la
        // cantidad de listicles que devuelve.
        query: `producto o startup que compite directamente con: ${pitchSummary}`,
        max_results: 5,
        search_depth: "basic",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      results?: Array<{ title?: string; content?: string; url?: string }>;
    };
    return (data.results ?? [])
      .map((r) => ({
        title: r.title ?? "",
        content: (r.content ?? "").slice(0, 400),
        url: r.url ?? "",
      }))
      .filter((r) => r.title.length > 0);
  } catch {
    return [];
  }
}

/**
 * Tavily devuelve sobre todo articulos ("Los 12 mejores X de 2026"), no
 * empresas. Tomar el titulo tal cual ponia un listicle como competidor y
 * arruinaba el momento. Un modelo rapido extrae el nombre real del producto.
 */
async function pickCompetitor(
  hits: SearchHit[],
  pitchSummary: string
): Promise<{ name: string; description: string } | null> {
  const listado = hits
    .map((h, i) => `${i + 1}. ${h.title}\n   ${h.url}\n   ${h.content}`)
    .join("\n\n");

  try {
    const raw = await generateResponse({
      system:
        "Extraes nombres de productos reales de resultados de busqueda. " +
        "Respondes SOLO con JSON, sin markdown, con la forma " +
        '{"name": string, "description": string}. ' +
        "name es el nombre comercial de UN producto o empresa que compita, " +
        "de 1 a 4 palabras, nunca el titulo de un articulo ni una lista. " +
        "description son 12 palabras como maximo sobre que hace. " +
        'Si ningun resultado menciona un producto concreto, responde {"name": null}.',
      prompt: `PITCH DEL USUARIO: ${pitchSummary}\n\nRESULTADOS:\n${listado}`,
      speed: "fast",
      temperature: 0.2,
      maxOutputTokens: 200,
    });

    const parsed = JSON.parse(stripFence(raw)) as {
      name?: string | null;
      description?: string;
    };
    if (typeof parsed.name !== "string" || parsed.name.trim().length === 0) {
      return null;
    }
    return {
      name: parsed.name.trim().slice(0, 60),
      description: (parsed.description ?? "").slice(0, 400),
    };
  } catch {
    return null;
  }
}

function stripFence(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  return t.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "").trim();
}

function fallbackFor(scenario: string) {
  return FALLBACK[scenario] ?? FALLBACK.hackathon;
}
