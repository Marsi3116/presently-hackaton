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
      .query("chaosEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/** Resumen del pitch para que el competidor buscado sea del rubro correcto. */
export const loadChaosInput = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null) return null;
    const report = await ctx.db
      .query("redTeamReports")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    return {
      scenario: session.scenario,
      goal: session.goal,
      pitchSummary: report?.pitchSummary ?? report?.summary ?? session.goal,
    };
  },
});

export const saveChaosEvent = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    competitorName: v.string(),
    competitorDescription: v.optional(v.string()),
    headline: v.string(),
    body: v.string(),
    callToAction: v.string(),
    tavilyUsed: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const previous = await ctx.db
      .query("chaosEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const old of previous) await ctx.db.delete(old._id);

    await ctx.db.insert("chaosEvents", {
      ...args,
      type: "competitor_attack",
      triggeredAt: Date.now(),
    });
    return null;
  },
});

export const recordResponse = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    userResponse: v.string(),
    responseDurationSec: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("chaosEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (event === null) return null;
    await ctx.db.patch(event._id, {
      userResponse: args.userResponse,
      responseDurationSec: args.responseDurationSec,
    });
    return null;
  },
});
