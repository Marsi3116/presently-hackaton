import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireUserId } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx.auth);
    return await ctx.storage.generateUploadUrl();
  },
});

export const save = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    extractedText: v.optional(v.string()),
    slideCount: v.optional(v.number()),
  },
  returns: v.id("uploads"),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) {
      throw new Error("Sesion no encontrada.");
    }

    // Un re-upload reemplaza al anterior: la sesion tiene un solo deck.
    const previous = await ctx.db
      .query("uploads")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const old of previous) {
      await ctx.storage.delete(old.storageId);
      await ctx.db.delete(old._id);
    }

    const uploadId = await ctx.db.insert("uploads", {
      sessionId: args.sessionId,
      storageId: args.storageId,
      filename: args.filename,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      extractedText: args.extractedText,
      slideCount: args.slideCount,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.sessionId, { status: "analyzing" });

    // El Red Team tarda 10-30s. Se agenda en vez de esperarse para que la
    // mutation devuelva ya y la UI pueda mostrar el estado "analizando".
    if ((args.extractedText ?? "").trim().length > 0) {
      await ctx.scheduler.runAfter(0, internal.redTeam.analyze, {
        sessionId: args.sessionId,
      });
    }
    return uploadId;
  },
});

export const getBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx.auth);
    const session = await ctx.db.get(args.sessionId);
    if (session === null || session.userId !== userId) return null;
    return await ctx.db
      .query("uploads")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

/** La lee la action del Red Team, que no tiene sesion de usuario. */
export const getBySessionInternal = internalMutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("uploads")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});
