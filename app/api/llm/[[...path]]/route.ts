import { ConvexHttpClient } from "convex/browser";
import { streamText } from "ai";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getModel } from "@/lib/llm";
import { PROMPTS } from "@/lib/prompts.generated";

// Endpoint "custom LLM" que consume Vapi. Vapi habla el formato de
// chat/completions de OpenAI, asi que la request entra y la respuesta sale en
// ese formato, con SSE.
//
// Catch-all opcional a proposito: Vapi trata la url configurada como BASE y le
// agrega /chat/completions, igual que haria con la API de OpenAI. Con una ruta
// fija en /api/llm, Vapi pegaba a /api/llm/chat/completions, recibia un 404 y
// cortaba la llamada con "error-providerfault-custom-llm-llm-failed" sin un
// solo turno. Asi responden las dos formas, y tambien el modo texto del
// navegador, que pega directo a /api/llm.
//
// Ruta publica a proposito: la llama Vapi server-to-server, sin sesion de
// Clerk. Ver proxy.ts.

export const maxDuration = 60;

type IncomingMessage = { role: string; content?: unknown };

export async function POST(req: Request) {
  const body: unknown = await req.json();
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body invalido." }, { status: 400 });
  }

  const payload = body as {
    messages?: IncomingMessage[];
    call?: { assistantOverrides?: { metadata?: Record<string, unknown> } };
    metadata?: Record<string, unknown>;
  };

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const sessionId = readSessionId(payload);

  // El system prompt del jurado lo configura el asistente en Vapi y llega
  // dentro de messages. No lo reescribimos: solo le agregamos el contexto.
  const systemParts: string[] = [];
  const turnos: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const m of messages) {
    const text = toText(m.content);
    if (text.length === 0) continue;
    if (m.role === "system") systemParts.push(text);
    else if (m.role === "assistant") turnos.push({ role: "assistant", content: text });
    else if (m.role === "user") turnos.push({ role: "user", content: text });
  }

  const contexto = sessionId === null ? null : await loadContext(sessionId);

  // En modo voz el system prompt llega desde el asistente de Vapi. El modo
  // texto pega contra este mismo endpoint desde el navegador y no manda
  // ninguno: sin este fallback el modelo responde como asistente servicial
  // en vez de como jurado adversarial.
  if (systemParts.length === 0) {
    systemParts.push(promptDelJurado(contexto?.scenario));
  }
  if (contexto !== null) systemParts.push(contexto.texto);

  // Guardar la respuesta del usuario antes de contestar: si la llamada se
  // corta, el After Action Report igual tiene el intercambio.
  const ultimo = turnos.at(-1);
  if (sessionId !== null && ultimo?.role === "user") {
    void persist(sessionId, "user", ultimo.content);
  }

  // Los errores de la API (429 por rate limit, 5xx del proveedor) NO se lanzan
  // desde textStream: el AI SDK solo lanza los que cortan la conexion. El
  // stream termina vacio y hay que enterarse por aca, o el jurado se queda
  // mudo y Vapi corta la llamada con "custom-llm-llm-failed".
  let fallo: unknown = null;

  const result = streamText({
    model: getModel("main"),
    system: systemParts.join("\n\n"),
    messages: turnos.length > 0 ? turnos : [{ role: "user", content: "Empieza el Q&A." }],
    temperature: 0.7,
    maxOutputTokens: 200,
    onError: ({ error }) => {
      fallo = error;
      console.error("[api/llm] el modelo fallo:", error);
    },
    onFinish: ({ text }) => {
      if (sessionId !== null && text.trim().length > 0) {
        void persist(sessionId, "jury", text);
      }
    },
  });

  return openAiStream(result.textStream, () => fallo);
}

/**
 * Lo que dice el jurado cuando el modelo no responde.
 *
 * Tiene que sonar a jurado, no a error de sistema: en una demo en vivo es
 * preferible que insista de forma generica antes que quedarse en silencio.
 */
const RESPUESTA_DE_EMERGENCIA =
  "Sigo esperando el dato concreto. Dame el numero y como lo calcularon.";

function readSessionId(payload: {
  call?: { assistantOverrides?: { metadata?: Record<string, unknown> } };
  metadata?: Record<string, unknown>;
}): Id<"sessions"> | null {
  const candidates = [
    payload.call?.assistantOverrides?.metadata?.sessionId,
    payload.metadata?.sessionId,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c as Id<"sessions">;
  }
  return null;
}

/** Vapi manda content como string o como array de partes. */
function toText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : ""
      )
      .join("")
      .trim();
  }
  return "";
}

/**
 * Los frentes por los que ataca el jurado, en orden.
 *
 * Uno por turno. Un jurado real no insiste cuatro veces sobre la evidencia:
 * pregunta por el dato, despues por como esta construido, despues por quien
 * lo usa, y al final por que lo hace distinto.
 */
const EJES: Record<string, string[]> = {
  hackathon: [
    "EVIDENCIA Y DATOS: los numeros que dijo, de donde salen y como se midieron",
    "VIABILIDAD TECNICA: como esta construido, que corre de verdad hoy y que es mockup",
    "USUARIO Y USABILIDAD: quien lo usa, si lo probaron con gente real y que paso",
    "DIFERENCIACION Y NEGOCIO: en que son distintos de lo que ya existe, y quien paga",
  ],
  thesis: [
    "METODOLOGIA: como diseno el estudio y por que ese metodo",
    "MUESTRA Y VALIDEZ: tamano, seleccion y que amenaza la validez de los resultados",
    "MARCO TEORICO: en que literatura se apoya y que autores contradicen su postura",
    "IMPLICANCIAS Y LIMITES: que se puede concluir de verdad y que no",
  ],
  investor: [
    "MERCADO: que tan grande es de verdad y como llegaron a ese numero",
    "UNIT ECONOMICS: cuanto cuesta traer un cliente y cuanto deja",
    "COMPETENCIA: quien mas lo hace y por que no los aplasta",
    "EQUIPO Y EJECUCION: por que este equipo y por que ahora",
  ],
};

function ejeDelTurno(scenario: string, yaHechas: number): string {
  const ejes = EJES[scenario] ?? EJES.hackathon;
  const eje = ejes[yaHechas % ejes.length];
  const restantes = ejes.filter((_, i) => i !== yaHechas % ejes.length);
  return (
    `\nEL FRENTE DE ESTA PREGUNTA ES: ${eje}\n` +
    "Quedate en ese frente y no vuelvas a los que ya cubriste:\n" +
    restantes.map((e) => `- ${e.split(":")[0]}`).join("\n")
  );
}

function promptDelJurado(scenario: string | undefined): string {
  switch (scenario) {
    case "thesis":
      return PROMPTS.judgeThesis.system;
    case "investor":
      return PROMPTS.judgeInvestor.system;
    default:
      return PROMPTS.judgeHackathon.system;
  }
}

async function loadContext(
  sessionId: Id<"sessions">
): Promise<{ scenario: string; texto: string } | null> {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    const ctx = await convex.query(api.reports.getJuryContext, { sessionId });
    if (ctx === null) return null;

    const bloques = [
      "--- CONTEXTO DE LA SESION ---",
      `ESCENARIO: ${ctx.scenario}`,
      `OBJETIVO DEL PRESENTADOR: ${ctx.goal}`,
      `DURACION OBJETIVO: ${ctx.duration} min`,
    ];
    if (ctx.rubric !== null && ctx.rubric.length > 0) {
      bloques.push(
        "\nRUBRICA CON LA QUE LO EVALUAN (la subio el usuario). Tus preguntas " +
          "deben apuntar a estos criterios:\n" +
          ctx.rubric
      );
    }
    // El contexto va resumido, no como JSON crudo. Vapi llama a este endpoint
    // en CADA turno, y la cuenta de OpenAI tiene 30.000 tokens por minuto:
    // mandar el reporte completo cada vez agota la cuota a mitad de la
    // conversacion y el jurado se queda mudo.
    if (ctx.redTeam !== null) {
      const debilidades = ctx.redTeam.weaknesses
        .slice(0, 5)
        .map((w) => `- ${w.slide ?? "s/n"} [${w.severity}] ${w.title}: ${w.description}`)
        .join("\n");
      const preguntas = ctx.redTeam.probableQuestions
        .slice(0, 4)
        .map((q) => `- (${q.probability}%) ${q.question}`)
        .join("\n");
      bloques.push(
        `\nRED TEAM (score ${ctx.redTeam.readinessScore}/100): ${ctx.redTeam.summary}` +
          `\n\nDEBILIDADES:\n${debilidades}` +
          `\n\nPREGUNTAS PREPARADAS:\n${preguntas}`
      );
    }
    if (ctx.transcript.length > 0) {
      // Lo ultimo que dijo es lo relevante para repreguntar.
      bloques.push(
        "\nLO QUE DIJO EL PRESENTADOR:\n" + recortarFinal(ctx.transcript, 2500)
      );
    }
    const yaPreguntadas = ctx.qa.filter((m) => m.role === "jury");

    if (ctx.qa.length > 0) {
      // Solo los ultimos turnos: el historial completo lo manda Vapi aparte.
      bloques.push(
        "\nQ&A RECIENTE:\n" +
          ctx.qa
            .slice(-6)
            .map((m) => `${m.role === "jury" ? "JURADO" : "USUARIO"}: ${m.text}`)
            .join("\n")
      );
    }

    if (yaPreguntadas.length > 0) {
      // El "say" de Vapi no entra en el contexto del modelo, asi que sin esto
      // el jurado repetia la pregunta que acababa de hacer.
      bloques.push(
        "\nPREGUNTAS QUE YA HICISTE. NO LAS REPITAS NI LAS PARAFRASEES:\n" +
          yaPreguntadas.map((m) => `- ${m.text}`).join("\n")
      );
    }

    // Cada turno ataca un frente distinto. Sin esto el jurado se quedaba
    // clavado en el mismo tema: preguntaba por la evidencia, y el follow-up
    // volvia a ser sobre evidencia.
    bloques.push(ejeDelTurno(ctx.scenario, yaPreguntadas.length));

    if (ctx.chaosActive) {
      bloques.push(
        "\nHAY UN CHAOS EVENT ACTIVO. El sistema tomo el control de la pantalla. No lo comentes ni lo anuncies."
      );
    }
    return { scenario: ctx.scenario, texto: bloques.join("\n") };
  } catch (error) {
    // El jurado tiene que seguir hablando aunque Convex falle. Sin contexto
    // pregunta de forma generica, que es mejor que un silencio en la demo.
    console.error("[api/llm] no se pudo cargar el contexto:", error);
    return null;
  }
}

/** Se queda con el final: es lo mas reciente y lo que hay que repreguntar. */
function recortarFinal(texto: string, maxChars: number): string {
  if (texto.length <= maxChars) return texto;
  return "[...] " + texto.slice(-maxChars);
}

async function persist(sessionId: Id<"sessions">, role: "jury" | "user", text: string) {
  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    await convex.mutation(api.qa.addFromJury, {
      sessionId,
      role,
      text,
      timestamp: Math.floor(Date.now() / 1000),
    });
  } catch (error) {
    console.error("[api/llm] no se pudo guardar el mensaje:", error);
  }
}

/**
 * Envuelve el stream de texto en chunks de chat.completion de OpenAI.
 *
 * Garantiza que SIEMPRE salga texto. Un stream vacio es SSE valido, asi que
 * Vapi lo acepta y despues corta la llamada porque el jurado no dijo nada.
 */
function openAiStream(
  textStream: AsyncIterable<string>,
  leerFallo: () => unknown
): Response {
  const id = `chatcmpl-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const chunk = (delta: object, finish: string | null) => ({
        id,
        object: "chat.completion.chunk",
        created,
        model: "presently-judge",
        choices: [{ index: 0, delta, finish_reason: finish }],
      });

      let emitido = 0;
      try {
        send(chunk({ role: "assistant", content: "" }, null));
        for await (const piece of textStream) {
          if (piece.length > 0) {
            emitido += piece.length;
            send(chunk({ content: piece }, null));
          }
        }
      } catch (error) {
        console.error("[api/llm] el stream se corto:", error);
      }

      if (emitido === 0) {
        const causa = leerFallo();
        console.error(
          "[api/llm] respuesta vacia, se usa la de emergencia. causa:",
          causa instanceof Error ? causa.message : causa
        );
        send(chunk({ content: RESPUESTA_DE_EMERGENCIA }, null));
      }

      send(chunk({}, "stop"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
