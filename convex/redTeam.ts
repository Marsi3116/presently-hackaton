"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { runRedTeam, toConvexShape } from "../lib/red-team";

// "use node" porque el AI SDK y sus proveedores necesitan el runtime de Node.
// Un archivo "use node" solo puede exportar actions; las queries y mutations
// de esta tabla viven en convex/reports.ts.

export const analyze = internalAction({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const input = await ctx.runQuery(internal.reports.loadAnalysisInput, {
      sessionId: args.sessionId,
    });
    if (input === null) {
      throw new Error("No hay upload para esta sesion.");
    }

    try {
      const result = await runRedTeam({
        scenario: input.scenario,
        goal: input.goal,
        duration: input.duration,
        extractedText: input.extractedText,
      });

      await ctx.runMutation(internal.reports.saveRedTeamReport, {
        sessionId: args.sessionId,
        uploadId: input.uploadId,
        ...toConvexShape(result),
      });
    } catch (error) {
      // Sin esto la sesion queda colgada en "analyzing" y la UI gira para
      // siempre. Marcamos failed y re-lanzamos para que quede en los logs.
      await ctx.runMutation(internal.reports.markFailed, {
        sessionId: args.sessionId,
      });
      throw error;
    }
    return null;
  },
});
