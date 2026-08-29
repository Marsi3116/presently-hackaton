import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const phase = v.union(
  v.literal("presentation"),
  v.literal("qa"),
  v.literal("chaos")
);

export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    text: v.string(),
    startTimestamp: v.number(),
    endTimestamp: v.number(),
    phase,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) {
      throw new Error("Sesion no encontrada.");
    }
    if (args.text.trim().length === 0) return null;
    await ctx.db.insert("transcripts", { ...args, createdAt: Date.now() });
    return null;
  },
});

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return [];
    return await ctx.db
      .query("transcripts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});
