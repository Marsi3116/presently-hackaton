import { v } from "convex/values";
import { query, mutation, internalQuery } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return [];
    return await ctx.db
      .query("qaMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("jury"), v.literal("user")),
    text: v.string(),
    timestamp: v.number(),
    isFollowUp: v.optional(v.boolean()),
    relatedWeaknessIndex: v.optional(v.number()),
  },
  returns: v.id("qaMessages"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) {
      throw new Error("Sesion no encontrada.");
    }
    return await ctx.db.insert("qaMessages", { ...args, createdAt: Date.now() });
  },
});

export const listBySessionInternal = internalQuery({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("qaMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

/**
 * La escribe /api/llm, que atiende a Vapi y no tiene sesion de Clerk.
 * Misma consideracion que reports.getJuryContext: el sessionId no es
 * adivinable y no se exponen datos del usuario.
 */
export const addFromJury = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("jury"), v.literal("user")),
    text: v.string(),
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (session === null) return null;
    await ctx.db.insert("qaMessages", { ...args, createdAt: Date.now() });
    return null;
  },
});
