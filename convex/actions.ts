"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { buildChaosEvent } from "../lib/chaos";
import {
  runFinalReport,
  toSeconds,
  normalizeTimelineType,
} from "../lib/final-report";

// Actions que hablan con APIs externas y necesitan runtime de Node.
// Las queries y mutations de estas tablas viven en convex/chaos.ts y
// convex/qa.ts: un archivo "use node" solo puede exportar actions.

export const triggerChaos = action({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const input = await ctx.runQuery(internal.chaos.loadChaosInput, {
      sessionId: args.sessionId,
    });
    if (input === null) throw new Error("Sesion no encontrada.");

    const message = await buildChaosEvent(input.pitchSummary, input.scenario);

    await ctx.runMutation(internal.chaos.saveChaosEvent, {
      sessionId: args.sessionId,
      competitorName: message.competitorName,
      competitorDescription: message.competitorDescription,
      headline: message.headline,
      body: message.body,
      callToAction: message.callToAction,
      tavilyUsed: message.tavilyUsed,
    });
    return null;
  },
});

export const generateReport = action({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const input = await ctx.runQuery(internal.finalReport.loadReportInput, {
      sessionId: args.sessionId,
    });
    if (input === null) throw new Error("Sesion no encontrada.");

    const report = await runFinalReport(input);

    await ctx.runMutation(internal.finalReport.saveFinalReport, {
      sessionId: args.sessionId,
      overallScore: Math.round(report.overallScore),
      subscores: {
        content: Math.round(report.subscores.content),
        argumentation: Math.round(report.subscores.argumentation),
        evidence: Math.round(report.subscores.evidence),
        communication: Math.round(report.subscores.communication),
        timeManagement: Math.round(report.subscores.timeManagement),
        qaHandling: Math.round(report.subscores.qaHandling),
        chaosResponse: Math.round(report.subscores.chaosResponse),
      },
      summary: report.summary,
      keyWins: report.keyWins,
      keyMisses: report.keyMisses,
      recommendations: report.recommendations,
      timeline: report.timeline.map((e) => ({
        timestamp: toSeconds(e.timestamp),
        type: normalizeTimelineType(e.type),
        severity: e.severity,
        title: e.title,
        detail: e.detail ?? undefined,
      })),
    });
    return null;
  },
});
