import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

export const save = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    extractedText: v.string(),
    source: v.union(v.literal("image"), v.literal("document")),
  },
  returns: v.id("rubrics"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) {
      throw new Error("Sesion no encontrada.");
    }

    // Una sola rubrica por sesion: subir otra reemplaza la anterior.
    for (const old of await ctx.db
      .query("rubrics")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()) {
      await ctx.storage.delete(old.storageId);
      await ctx.db.delete(old._id);
    }

    return await ctx.db.insert("rubrics", { ...args, createdAt: Date.now() });
  },
});

export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return null;
    return await ctx.db
      .query("rubrics")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});
