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

  const result = streamText({
    model: getModel("main"),
    system: systemParts.join("\n\n"),
    messages: turnos.length > 0 ? turnos : [{ role: "user", content: "Empieza el Q&A." }],
    temperature: 0.7,
    maxOutputTokens: 200,
    onFinish: ({ text }) => {
      if (sessionId !== null && text.trim().length > 0) {
        void persist(sessionId, "jury", text);
      }
    },
  });

  return openAiStream(result.textStream);
}

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
    if (ctx.redTeam !== null) {
      bloques.push("\nRED TEAM REPORT:\n" + JSON.stringify(ctx.redTeam));
    }
    if (ctx.transcript.length > 0) {
      bloques.push("\nTRANSCRIPCION DE LA PRESENTACION:\n" + ctx.transcript);
    }
    if (ctx.qa.length > 0) {
      bloques.push(
        "\nQ&A HASTA AHORA:\n" +
          ctx.qa.map((m) => `${m.role === "jury" ? "JURADO" : "USUARIO"}: ${m.text}`).join("\n")
      );
    }
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

/** Envuelve el stream de texto en chunks de chat.completion de OpenAI. */
function openAiStream(textStream: AsyncIterable<string>): Response {
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

      try {
        send(chunk({ role: "assistant", content: "" }, null));
        for await (const piece of textStream) {
          if (piece.length > 0) send(chunk({ content: piece }, null));
        }
        send(chunk({}, "stop"));
      } catch (error) {
        console.error("[api/llm] fallo el stream:", error);
        send(chunk({ content: " Disculpa, se cortó. Repite tu respuesta." }, "stop"));
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
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
