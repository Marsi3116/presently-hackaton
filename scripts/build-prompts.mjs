// Extrae los bloques de prompts/*.md a un modulo TypeScript.
//
// Por que generar en vez de leer los .md en runtime: las Convex actions corren
// en el runtime de Convex, que no tiene acceso al filesystem del repo. Un
// modulo TS es lo unico que funciona igual en Next y en Convex, y mantiene
// prompts/ como unica fuente de verdad editable por quien no toca codigo.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SRC = "prompts";
const OUT = "lib/prompts.generated.ts";

const SECTIONS = {
  system: "## System prompt",
  userTemplate: "## User prompt template",
  opener: "## Primera pregunta (opener)",
  fallback: "## Fallback si Tavily falla",
};

/** Devuelve el contenido del primer bloque ``` que sigue al heading. */
function blockAfter(md, heading) {
  const start = md.indexOf(heading);
  if (start === -1) return null;
  const rest = md.slice(start + heading.length);
  const open = rest.indexOf("```");
  if (open === -1) return null;
  const afterOpen = rest.indexOf("\n", open);
  const close = rest.indexOf("```", afterOpen);
  if (close === -1) return null;
  return rest.slice(afterOpen + 1, close).trimEnd();
}

const camel = (s) => s.replace(/\.md$/, "").replace(/-(\w)/g, (_, c) => c.toUpperCase());

const files = (await readdir(SRC)).filter((f) => f.endsWith(".md")).sort();
const entries = [];

for (const file of files) {
  const md = await readFile(join(SRC, file), "utf8");
  const parts = {};
  for (const [key, heading] of Object.entries(SECTIONS)) {
    const block = blockAfter(md, heading);
    if (block) parts[key] = block;
  }
  if (!parts.system) {
    throw new Error(`${file}: no se encontro un bloque bajo "${SECTIONS.system}"`);
  }
  entries.push([camel(file), parts]);
}

const body = entries
  .map(([name, parts]) => {
    const fields = Object.entries(parts)
      .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
      .join("\n");
    return `  ${name}: {\n${fields}\n  },`;
  })
  .join("\n");

const out = `// GENERADO por scripts/build-prompts.mjs — no editar a mano.
// Fuente: prompts/*.md. Regenerar con \`npm run prompts\`.

export const PROMPTS = {
${body}
} as const;

export type PromptKey = keyof typeof PROMPTS;
`;

await writeFile(OUT, out, "utf8");
console.log(`${OUT}: ${entries.length} prompts -> ${entries.map(([n]) => n).join(", ")}`);
