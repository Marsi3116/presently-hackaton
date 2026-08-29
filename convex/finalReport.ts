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
      .query("finalReports")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const listTimeline = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return [];
    return await ctx.db
      .query("timelineEvents")
      .withIndex("by_session_and_timestamp", (q) =>
        q.eq("sessionId", args.sessionId)
      )
      .collect();
  },
});

/** Todo el material que el post-mortem necesita, en una sola lectura. */
export const loadReportInput = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null) return null;

    const [redTeam, chaosEvent, qa, transcripts] = await Promise.all([
      ctx.db
        .query("redTeamReports")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .first(),
      ctx.db
        .query("chaosEvents")
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
    ]);

    return {
      scenario: session.scenario,
      goal: session.goal,
      duration: session.duration,
      redTeamReportJson: redTeam === null ? "(sin red team)" : JSON.stringify(redTeam),
      presentationTranscript: transcripts
        .filter((t) => t.phase === "presentation")
        .sort((a, b) => a.startTimestamp - b.startTimestamp)
        .map((t) => t.text)
        .join("\n"),
      qaHistory: qa
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((m) => `${m.role === "jury" ? "JURADO" : "USUARIO"}: ${m.text}`)
        .join("\n"),
      chaosMessage:
        chaosEvent === null
          ? ""
          : `${chaosEvent.headline} ${chaosEvent.body} ${chaosEvent.callToAction}`,
      chaosResponse: chaosEvent?.userResponse ?? "",
    };
  },
});

export const saveFinalReport = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    overallScore: v.number(),
    subscores: v.object({
      content: v.number(),
      argumentation: v.number(),
      evidence: v.number(),
      communication: v.number(),
      timeManagement: v.number(),
      qaHandling: v.number(),
      chaosResponse: v.number(),
    }),
    summary: v.string(),
    keyWins: v.array(v.string()),
    keyMisses: v.array(v.string()),
    recommendations: v.array(
      v.object({
        priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
        title: v.string(),
        detail: v.string(),
      })
    ),
    timeline: v.array(
      v.object({
        timestamp: v.number(),
        type: v.string(),
        severity: v.union(
          v.literal("ok"),
          v.literal("info"),
          v.literal("warning"),
          v.literal("critical")
        ),
        title: v.string(),
        detail: v.optional(v.any()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { sessionId, timeline, ...report } = args;

    for (const old of await ctx.db
      .query("finalReports")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect()) {
      await ctx.db.delete(old._id);
    }
    // El timeline se regenera entero: es derivado del reporte, no historico.
    for (const old of await ctx.db
      .query("timelineEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", sessionId))
      .collect()) {
      await ctx.db.delete(old._id);
    }

    await ctx.db.insert("finalReports", {
      sessionId,
      ...report,
      generatedAt: Date.now(),
    });

    for (const event of timeline) {
      await ctx.db.insert("timelineEvents", {
        sessionId,
        timestamp: event.timestamp,
        // El union del schema es cerrado; el normalizador ya lo acoto.
        type: event.type as "start",
        severity: event.severity,
        title: event.title,
        detail: event.detail,
        createdAt: Date.now(),
      });
    }

    await ctx.db.patch(sessionId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return null;
  },
});
