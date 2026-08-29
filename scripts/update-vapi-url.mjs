// Re-apunta los 3 asistentes de Vapi a una nueva URL de custom LLM.
//
//   node scripts/update-vapi-url.mjs https://tu-app.vercel.app/api/llm
//
// Hace falta cada vez que cambia la URL publica: al desplegar a Vercel, y
// cada vez que se reinicia ngrok en desarrollo.
//
// Manda SIEMPRE los system prompts junto con la url. Vapi reemplaza el objeto
// `model` entero en vez de hacer merge: un PATCH sin `messages` deja a los
// jurados sin prompt, y el fallo es silencioso.

import { readFileSync } from "node:fs";

const url = process.argv[2];
if (url === undefined || !url.startsWith("http")) {
  console.error("Uso: node scripts/update-vapi-url.mjs <url-completa-de-/api/llm>");
  process.exit(1);
}

function env(name) {
  const file = readFileSync(".env.local", "utf8");
  const line = file.split("\n").find((l) => l.startsWith(`${name}=`));
  if (line === undefined) throw new Error(`Falta ${name} en .env.local`);
  return line.slice(name.length + 1).replace(/\s*#.*$/, "").trim();
}

const src = readFileSync("lib/prompts.generated.ts", "utf8");
function systemOf(key) {
  const i = src.indexOf(`  ${key}: {`);
  if (i === -1) throw new Error(`No se encontro el prompt ${key}`);
  const j = src.indexOf('    system: "', i);
  const start = j + "    system: ".length;
  return JSON.parse(src.slice(start, src.indexOf('",\n', start) + 1));
}

const ASISTENTES = [
  { env: "VAPI_ASSISTANT_ID_HACKATHON", key: "judgeHackathon", nombre: "Hackathon" },
  { env: "VAPI_ASSISTANT_ID_THESIS", key: "judgeThesis", nombre: "Tesis" },
  { env: "VAPI_ASSISTANT_ID_INVESTOR", key: "judgeInvestor", nombre: "Inversionista" },
];

const apiKey = env("VAPI_API_KEY");
let fallos = 0;

for (const a of ASISTENTES) {
  const id = env(a.env);
  const res = await fetch(`https://api.vapi.ai/assistant/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: {
        provider: "custom-llm",
        url,
        model: "presently-judge",
        messages: [{ role: "system", content: systemOf(a.key) }],
      },
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    console.error(`  ERROR ${a.nombre}: ${JSON.stringify(json.message ?? json).slice(0, 200)}`);
    fallos++;
    continue;
  }
  const tienePrompt = (json.model?.messages ?? []).length > 0;
  console.log(
    `  OK  ${a.nombre.padEnd(14)} url=${json.model?.url}  prompt=${tienePrompt ? "OK" : "VACIO"}`
  );
  if (!tienePrompt) fallos++;
}

if (fallos > 0) {
  console.error(`\n${fallos} asistente(s) quedaron mal. Revisa antes de demostrar.`);
  process.exit(1);
}
console.log("\nListo. Acuerdate de actualizar VAPI_CUSTOM_LLM_URL en .env.local.");
