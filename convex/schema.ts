// convex/schema.ts
//
// Schema de Presently para The Next Craft 2026.
// Todas las tablas necesarias para el MVP.
//
// IMPORTANTE: si necesitas cambiar este schema, aplica la migración con
// `npx convex dev` y confirmá que los tipos generados en convex/_generated
// se actualizaron antes de escribir código nuevo.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================
  // SESSIONS
  // Una sesión = un intento completo de práctica.
  // Referenciada por todo lo demás.
  // ============================================================
  sessions: defineTable({
    userId: v.string(), // Clerk user ID
    scenario: v.union(
      v.literal("hackathon"),
      v.literal("thesis"),
      v.literal("investor")
    ),
    duration: v.number(), // minutos, típicamente 3, 5 o 10
    goal: v.string(), // objetivo del presentador, texto libre
    status: v.union(
      v.literal("setup"), // creada, sin upload aún
      v.literal("analyzing"), // upload subido, red team corriendo
      v.literal("ready"), // red team listo, esperando arrancar simulación
      v.literal("presenting"), // usuario presentando
      v.literal("qa"), // en Q&A
      v.literal("chaos"), // chaos event activo
      v.literal("reporting"), // generando reporte final
      v.literal("completed"), // reporte listo
      v.literal("failed")
    ),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"]),

  // ============================================================
  // UPLOADS
  // Referencia al PPT/PDF subido a Convex Storage.
  // ============================================================
  uploads: defineTable({
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    extractedText: v.optional(v.string()), // texto extraído del PPT/PDF
    slideCount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"]),

  // ============================================================
  // RED TEAM REPORTS
  // Resultado del análisis inicial del contenido.
  // ============================================================
  redTeamReports: defineTable({
    sessionId: v.id("sessions"),
    uploadId: v.id("uploads"),
    readinessScore: v.number(), // 0-100
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
        slide: v.optional(v.string()), // "Slide 4" o "Página 2"
        title: v.string(),
        description: v.string(),
        excerpt: v.optional(v.string()),
      })
    ),
    probableQuestions: v.array(
      v.object({
        probability: v.number(), // 0-100
        question: v.string(),
        askedBy: v.string(), // "Jurado escéptico", etc.
        riskLevel: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
        relatedWeaknessIndex: v.optional(v.number()),
      })
    ),
    summary: v.string(), // una línea de resumen
    // resumen conciso del pitch para inyectar en el contexto del jurado
    pitchSummary: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"]),

  // ============================================================
  // TRANSCRIPTS
  // Segmentos de la presentación del usuario (via Vapi STT).
  // Muchos por sesión, se acumulan durante la presentación.
  // ============================================================
  transcripts: defineTable({
    sessionId: v.id("sessions"),
    text: v.string(),
    startTimestamp: v.number(), // segundos desde el inicio de la sesión
    endTimestamp: v.number(),
    slideNumber: v.optional(v.number()), // en qué slide estaba cuando dijo esto
    phase: v.union(
      v.literal("presentation"),
      v.literal("qa"),
      v.literal("chaos")
    ),
    // Datos vocales opcionales (velocidad, pausas) si se calculan
    metadata: v.optional(
      v.object({
        wordsPerMinute: v.optional(v.number()),
        pauseCount: v.optional(v.number()),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_phase", ["sessionId", "phase"]),

  // ============================================================
  // QA MESSAGES
  // Cada pregunta del jurado y cada respuesta del usuario.
  // ============================================================
  qaMessages: defineTable({
    sessionId: v.id("sessions"),
    role: v.union(
      v.literal("jury"), // pregunta o comentario del jurado
      v.literal("user") // respuesta del usuario
    ),
    text: v.string(),
    // Solo aplica a mensajes del jurado
    isFollowUp: v.optional(v.boolean()),
    // Referencia al mensaje al que responde/sigue
    inReplyTo: v.optional(v.id("qaMessages")),
    // Si el mensaje del jurado se generó desde una weakness específica
    relatedWeaknessIndex: v.optional(v.number()),
    timestamp: v.number(), // segundos desde inicio de sesión
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"]),

  // ============================================================
  // TIMELINE EVENTS
  // Momentos marcables para el After Action Report.
  // Se van insertando durante la sesión y al final el reporte los usa.
  // ============================================================
  timelineEvents: defineTable({
    sessionId: v.id("sessions"),
    timestamp: v.number(), // segundos desde inicio de sesión
    type: v.union(
      v.literal("start"),
      v.literal("slide_change"),
      v.literal("content_delivery"),
      v.literal("critical_moment"),
      v.literal("qa_start"),
      v.literal("jury_question"),
      v.literal("user_response"),
      v.literal("chaos_event"),
      v.literal("end")
    ),
    severity: v.union(
      v.literal("ok"),
      v.literal("info"),
      v.literal("warning"),
      v.literal("critical")
    ),
    title: v.string(),
    // Detail estructurado. Formato depende del type.
    // Ej: { content, voice, audience_reaction, outcome } para critical_moment
    detail: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_and_timestamp", ["sessionId", "timestamp"]),

  // ============================================================
  // CHAOS EVENTS
  // Un registro específico del Chaos Event de esta sesión (siempre 1
  // en el MVP, futuro-proofed para múltiples).
  // ============================================================
  chaosEvents: defineTable({
    sessionId: v.id("sessions"),
    type: v.literal("competitor_attack"), // solo este en MVP
    competitorName: v.string(),
    competitorDescription: v.optional(v.string()),
    headline: v.string(),
    body: v.string(),
    callToAction: v.string(),
    triggeredAt: v.number(),
    userResponse: v.optional(v.string()), // se llena cuando el usuario responde
    responseDurationSec: v.optional(v.number()),
    tavilyUsed: v.boolean(), // false si se usó fallback
  })
    .index("by_session", ["sessionId"]),

  // ============================================================
  // FINAL REPORTS
  // El After Action Report generado al final.
  // ============================================================
  finalReports: defineTable({
    sessionId: v.id("sessions"),
    overallScore: v.number(), // 0-100
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
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
        title: v.string(),
        detail: v.string(),
      })
    ),
    // Los timeline events se leen de la tabla timelineEvents, no se
    // duplican aquí. El reporte solo agrega el rollup.
    generatedAt: v.number(),
  })
    .index("by_session", ["sessionId"]),
});
