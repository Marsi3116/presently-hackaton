import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const scenario = v.union(
  v.literal("hackathon"),
  v.literal("thesis"),
  v.literal("investor")
);

const status = v.union(
  v.literal("setup"),
  v.literal("analyzing"),
  v.literal("ready"),
  v.literal("presenting"),
  v.literal("qa"),
  v.literal("chaos"),
  v.literal("reporting"),
  v.literal("completed"),
  v.literal("failed")
);

export const create = mutation({
  args: {
    scenario,
    duration: v.number(),
    goal: v.string(),
  },
  returns: v.id("sessions"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    if (args.duration <= 0 || args.duration > 60) {
      throw new Error("La duracion debe estar entre 1 y 60 minutos.");
    }
    return await ctx.db.insert("sessions", {
      userId,
      scenario: args.scenario,
      duration: args.duration,
      goal: args.goal.trim(),
      status: "setup",
      createdAt: Date.now(),
    });
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    // Devolver null y no lanzar: la sesion ajena y la inexistente deben ser
    // indistinguibles desde afuera.
    if (session === null || session.userId !== userId) return null;
    return session;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx.auth);
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

export const setStatus = mutation({
  args: { sessionId: v.id("sessions"), status },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) {
      throw new Error("Sesion no encontrada.");
    }
    await ctx.db.patch(args.sessionId, {
      status: args.status,
      ...(args.status === "completed" ? { completedAt: Date.now() } : {}),
    });
    return null;
  },
});

/** Para que las actions cambien el estado sin pasar por la sesion del usuario. */
export const setStatusInternal = internalMutation({
  args: { sessionId: v.id("sessions"), status },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { status: args.status });
    return null;
  },
});
