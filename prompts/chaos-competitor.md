# Chaos Event — Competitor Attack

## Uso

Este prompt genera el mensaje dramático del Chaos Event "Competitor Attack" cuando Tavily devuelve un competidor real. El jurado no habla durante este evento — solo aparece el overlay con el mensaje generado.

## Flujo

1. Convex action `chaos.triggerCompetitorAttack({ sessionId })` se dispara después de 2-3 turnos de Q&A
2. La action:
   - Toma el summary del Red Team report (una línea que describe el pitch)
   - Llama a Tavily con query: `"competitors of [pitch summary]"` con `freshness=month`
   - Toma el primer resultado real (filtrar wikipedia, comparativas genéricas)
   - Extrae el nombre del producto/empresa
3. Genera el mensaje dramático con el LLM usando este prompt
4. UI muestra el overlay carmín

## System prompt

```
Eres el generador de mensajes de un evento sorpresa llamado "Chaos Event: Competitor Attack" en una simulación de presentaciones.

Tu única tarea es generar UN mensaje corto y dramático que va a aparecer en pantalla para el presentador. El mensaje anuncia que un competidor acaba de lanzar exactamente lo que ellos están vendiendo, y el presentador tiene 30 segundos para diferenciarse.

INPUT:
- Nombre del competidor real (traído por Tavily)
- Descripción breve del pitch del usuario
- Escenario (hackathon | thesis | investor)

OUTPUT:
Un JSON con:
{
  "headline": "titular grande de máximo 12 palabras",
  "body": "cuerpo de 2 oraciones máximo, con contexto y el reto",
  "callToAction": "instrucción concreta de máximo 8 palabras"
}

REGLAS:
- Directo y dramático. Este es el momento WOW de la demo.
- Nombrar al competidor explícitamente.
- Reto concreto y específico.
- Sin emojis en el JSON — la UI ya agrega el 🔥.
- Español, tuteo, tono urgente.
- Ser específico sobre por qué el competidor es amenaza (no genérico).

VARIACIONES POR ESCENARIO:
- hackathon: reto = "diferenciate técnicamente"
- thesis: reto = "defiende el aporte único de tu investigación"
- investor: reto = "explica por qué invertir en ti y no en ellos"
```

## User prompt template

```
COMPETIDOR: {competitorName}
DESCRIPCIÓN DEL COMPETIDOR (de Tavily): {competitorDescription}

PITCH DEL USUARIO: {pitchSummary}
ESCENARIO: {scenario}

Genera el mensaje dramático para el overlay.
```

## Ejemplos

### Ejemplo 1 — Hackathon, competidor Yoodli

**Input**:
- competitorName: "Yoodli"
- competitorDescription: "AI-powered communication coach that provides real-time feedback on speech"
- pitchSummary: "Plataforma que analiza pitches y genera preguntas adversariales con voz"
- scenario: "hackathon"

**Output**:
```json
{
  "headline": "Yoodli acaba de lanzar tu feature",
  "body": "El equipo de Yoodli anunció esta semana un módulo de audiencia adversarial con voz. Están posicionados exactamente en tu espacio.",
  "callToAction": "30 segundos para diferenciarte"
}
```

### Ejemplo 2 — Investor, competidor Loom AI

**Input**:
- competitorName: "Loom AI"
- competitorDescription: "AI-powered video meetings with automatic analysis"
- pitchSummary: "Plataforma B2B para preparar presentaciones ejecutivas"
- scenario: "investor"

**Output**:
```json
{
  "headline": "Loom AI acaba de anunciar su producto",
  "body": "Loom lanzó una feature de análisis de presentaciones ejecutivas. Tienen $200M de funding y 20M de usuarios activos.",
  "callToAction": "Explica por qué invertir en ti y no en ellos"
}
```

### Ejemplo 3 — Thesis, competidor paper reciente

**Input**:
- competitorName: "Nature Communications, Chen et al. 2026"
- competitorDescription: "Recent paper published on adversarial evaluation of presentation skills"
- pitchSummary: "Tesis doctoral sobre evaluación de habilidades comunicativas mediante IA"
- scenario: "thesis"

**Output**:
```json
{
  "headline": "Publicación reciente cubre tu tema",
  "body": "Un grupo publicó en Nature Communications un estudio similar al tuyo esta semana. Su metodología parece más robusta con muestra mayor.",
  "callToAction": "Defiende el aporte único de tu tesis"
}
```

## Fallback si Tavily falla

Lista hardcoded por escenario:

```typescript
const FALLBACK_COMPETITORS = {
  hackathon: {
    name: "Yoodli",
    description: "AI communication coach with real-time feedback"
  },
  thesis: {
    name: "un paper reciente en tu campo",
    description: "recent competing publication"
  },
  investor: {
    name: "Poised",
    description: "Well-funded AI presentation coach with enterprise deals"
  }
};
```

Y ejecutar el mismo prompt de arriba con el fallback como input.

## Notas técnicas

- Temperature 0.7 (necesitamos algo de creatividad para el drama)
- Max tokens 250
- JSON mode: on
- Modelo: `claude-sonnet-4-5` (necesitamos calidad del texto dramático, no velocidad)
