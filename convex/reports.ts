import { v } from "convex/values";
import { query, internalQuery, internalMutation } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return null;
    return await ctx.db
      .query("redTeamReports")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/** Contexto que necesita la action del Red Team. No pasa por sesion de usuario. */
export const loadAnalysisInput = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null) return null;
    const upload = await ctx.db
      .query("uploads")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (upload === null) return null;
    const rubric = await ctx.db
      .query("rubrics")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    return {
      scenario: session.scenario,
      goal: session.goal,
      duration: session.duration,
      extractedText: upload.extractedText ?? "",
      uploadId: upload._id,
      rubric: rubric?.extractedText,
    };
  },
});

export const saveRedTeamReport = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    uploadId: v.id("uploads"),
    readinessScore: v.number(),
    subscores: v.object({
      argumentation: v.number(),
      evidence: v.number(),
      narrative: v.number(),
      defendability: v.number(),
    }),
    weaknesses: v.array(
      v.object({
        type: v.union(
          v.literal("unsupported_claim"),
          v.literal("contradiction"),
          v.literal("undefined_term"),
          v.literal("narrative_gap"),
          v.literal("weak_argument"),
          v.literal("missing_evidence"),
          v.literal("false_uniqueness")
        ),
        severity: v.union(
          v.literal("critical"),
          v.literal("warning"),
          v.literal("info")
        ),
        slide: v.optional(v.string()),
        title: v.string(),
        description: v.string(),
        excerpt: v.optional(v.string()),
      })
    ),
    probableQuestions: v.array(
      v.object({
        probability: v.number(),
        question: v.string(),
        askedBy: v.string(),
        riskLevel: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
        relatedWeaknessIndex: v.optional(v.number()),
      })
    ),
    summary: v.string(),
    pitchSummary: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { sessionId, ...report } = args;

    // Re-analizar reemplaza el reporte anterior: una sesion tiene uno solo.
    const previous = await ctx.db
      .query("redTeamReports")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect();
    for (const old of previous) await ctx.db.delete(old._id);

    await ctx.db.insert("redTeamReports", {
      sessionId,
      ...report,
      createdAt: Date.now(),
    });
    await ctx.db.patch(sessionId, { status: "ready" });
    return null;
  },
});

export const markFailed = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { status: "failed" });
    return null;
  },
});

/**
 * Contexto que /api/llm inyecta en cada turno del jurado.
 *
 * Sin auth a proposito: quien llama es Vapi, server-to-server, y no tiene
 * sesion de Clerk. La proteccion es que el sessionId es un id de Convex de 32
 * caracteres, no adivinable, y solo devuelve material de la presentacion, sin
 * datos del usuario. Si esto pasa a produccion real, cambiar por un token
 * firmado de corta vida en el metadata de la llamada.
 */
export const getJuryContext = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null) return null;

    const [report, qa, transcripts, chaosEvent, rubric] = await Promise.all([
      ctx.db
        .query("redTeamReports")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .first(),
      ctx.db
        .query("qaMessages")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect(),
      ctx.db
        .query("transcripts")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .collect(),
      ctx.db
        .query("chaosEvents")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .first(),
      ctx.db
        .query("rubrics")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .first(),
    ]);

    return {
      rubric: rubric?.extractedText ?? null,
      scenario: session.scenario,
      goal: session.goal,
      duration: session.duration,
      redTeam:
        report === null
          ? null
          : {
              readinessScore: report.readinessScore,
              summary: report.summary,
              weaknesses: report.weaknesses,
              probableQuestions: report.probableQuestions,
            },
      transcript: transcripts
        .sort((a, b) => a.startTimestamp - b.startTimestamp)
        .map((t) => t.text)
        .join(" "),
      qa: qa
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((m) => ({ role: m.role, text: m.text })),
      chaosActive: chaosEvent !== null && chaosEvent.userResponse === undefined,
    };
  },
});
