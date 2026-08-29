# Arquitectura técnica

## Diagrama de flujo de datos

```
┌────────────────┐
│  User Browser  │
│   (Next.js)    │
└────────┬───────┘
         │
         │ HTTP + WS
         ▼
┌────────────────────────────────────────────┐
│           CONVEX (backend)                  │
│                                              │
│  Queries/Mutations       Actions            │
│  - sessions              - analyzeSubmission│
│  - uploads               - triggerChaos     │
│  - qa messages           - generateReport   │
│  - timeline events                          │
│                                              │
│  Storage: PPTs, PDFs                        │
└────┬─────────┬────────────┬─────────────────┘
     │         │            │
     │         │            │
     ▼         ▼            ▼
┌────────┐  ┌──────┐   ┌────────┐
│ Vapi   │  │ LLM  │   │Tavily  │
│(voice) │  │(Anthr│   │(search)│
│        │  │/OAI) │   │        │
└───┬────┘  └──────┘   └────────┘
    │
    │ webhooks
    │
    ▼
┌──────────────────────┐
│ /api/vapi/webhook    │
│ /api/llm (custom LLM │
│   endpoint for Vapi) │
└──────────────────────┘
```

## Componentes principales

### 1. Frontend (Next.js 15 App Router)

- **Server Components por defecto** para páginas que solo leen datos
- **Client Components** para todo lo interactivo (present, chaos overlay, transcription)
- **Server Actions** para escrituras desde forms
- Data fetching via **Convex hooks** (`useQuery`, `useMutation`)

### 2. Convex (backend)

Toda la data persistida vive aquí. Se usa como:

- **Base de datos** (documentos)
- **Storage** para PPT/PDF
- **Backend functions**:
  - `query` — lecturas, se pueden usar con `useQuery` reactivo
  - `mutation` — escrituras deterministas (no llaman APIs externas)
  - `action` — pueden llamar APIs externas (Claude, Vapi, Tavily). No son transaccionales.

**Regla crítica**: cualquier función que llame a un API externo (Claude, OpenAI, Tavily, ElevenLabs, Vapi REST) debe ser una **action**, no mutation. Las mutations son transaccionales y no pueden hacer fetch.

### 3. Vapi (voice)

Vapi maneja:
- Speech-to-text del usuario
- Text-to-speech del jurado (con voz de ElevenLabs)
- Turn detection
- Orquestación de la conversación

El "cerebro" del jurado (el LLM) se configura en Vapi como **custom LLM** apuntando a nuestro endpoint `/api/llm`. Esto nos da control total sobre el prompt, el modelo, y el contexto (podemos inyectar el Red Team report como contexto).

### 4. LLM (Claude / OpenAI)

Se usa en dos lugares:
- **Red Team**: análisis del PPT/PDF. Corre en una Convex action.
- **Jurado**: cada turno de conversación. Corre en `/api/llm` (Next.js route handler) que Vapi llama.

Abstracción en `lib/llm.ts` para poder cambiar de provider con env var.

### 5. Tavily (búsqueda)

Solo se usa para el Chaos Event "Competitor Attack". Convex action llama a Tavily, toma el primer resultado real, arma el mensaje.

## Flujo end-to-end de una sesión

### Fase 1: Setup
1. Usuario está en `/`, click "Nueva presentación"
2. Redirect a `/new` (auth con Clerk si no está logueado)
3. Usuario elige escenario, duración, objetivo, click "Continuar"
4. **Mutation**: `sessions.create({ userId, scenario, duration, goal })` → devuelve `sessionId`
5. Redirect a `/upload/[sessionId]`

### Fase 2: Upload + Red Team
1. Usuario sube archivo → **Convex Storage** guarda, devuelve `storageId`
2. **Mutation**: `uploads.register({ sessionId, storageId, filename, size })`
3. **Action**: `redTeam.analyzeSubmission({ uploadId })`:
   - Obtiene el archivo de storage
   - Extrae texto (pdf-parse o pptx2json)
   - Llama a `generateResponse()` con el prompt de `prompts/red-team.md`
   - Parsea el JSON response
   - **Mutation** interna: guarda en `red_team_reports`
4. UI reactiva muestra el reporte cuando aparece
5. Usuario click "Empezar simulación" → redirect a `/present/[sessionId]`

### Fase 3: Presentación en vivo
1. Componente cliente `<PresentationRoom sessionId={id} />` monta
2. Inicia Vapi call con config custom (asistente configurado con el prompt del jurado del escenario correspondiente)
3. Vapi transcribe en tiempo real → callback → **mutation**: `qa.addTranscript({ sessionId, text, timestamp })`
4. UI muestra la transcripción reactiva
5. Cuando el timer llega a 0 o el usuario dice "he terminado":
   - Vapi cambia de modo (usuario deja de hablar, jurado empieza)
   - Se dispara el Q&A

### Fase 4: Q&A adversarial
1. Vapi le pide al LLM la primera pregunta llamando a `/api/llm`
2. Nuestro endpoint recibe la request, arma el contexto:
   - System prompt del jurado
   - Red Team report (inyectado como contexto)
   - Transcripción de la presentación
   - Historial del Q&A hasta ahora
3. Llama a Claude/OpenAI, devuelve respuesta en formato OpenAI-compatible
4. Vapi convierte a voz con ElevenLabs y la reproduce
5. Usuario responde, se transcribe, se pasa al LLM para decidir:
   - ¿La respuesta fue satisfactoria? → siguiente pregunta
   - ¿Fue floja? → follow-up
6. Después de 2-3 turnos → dispara Chaos Event

### Fase 5: Chaos Event
1. **Action**: `chaos.triggerCompetitorAttack({ sessionId })`:
   - Obtiene el resumen del pitch del Red Team report
   - Llama a Tavily con query tipo "competitors of [pitch description]"
   - Toma primer resultado real, extrae nombre del producto/empresa
   - Si Tavily falla, fallback a lista hardcoded
   - **Mutation**: guarda en `timeline_events` como evento tipo "chaos"
2. UI reacciona, muestra el overlay
3. Timer corre 30 seg
4. Usuario responde
5. Se guarda la respuesta

### Fase 6: After Action Report
1. **Action**: `report.generate({ sessionId })`:
   - Obtiene toda la sesión: Red Team, transcripción, Q&A, chaos response
   - Llama al LLM con el prompt de `prompts/final-report.md`
   - Genera scores por categoría, timeline events con clasificación (verde/amber/red), recomendaciones
   - **Mutation**: guarda en `final_reports`
2. Redirect a `/report/[sessionId]`
3. UI reactiva muestra el reporte

## Módulos de código clave

### `lib/llm.ts`

```typescript
// Abstracción sobre providers de LLM
// Soporta: 'anthropic' | 'openai'
// Configuración via env var LLM_PROVIDER

export async function generateResponse(
  systemPrompt: string,
  messages: Message[],
  options?: { model?: string; jsonMode?: boolean }
): Promise<string>
```

### `lib/vapi-config.ts`

```typescript
// Configuración de asistentes de Vapi por escenario
export const juryConfig = {
  'hackathon': { voiceId: '...', systemPromptFile: 'judge-hackathon.md', ... },
  'thesis': { voiceId: '...', systemPromptFile: 'judge-thesis.md', ... },
  'investor': { voiceId: '...', systemPromptFile: 'judge-investor.md', ... },
}
```

### `lib/parse-content.ts`

```typescript
// Extrae texto de PPT/PDF
export async function extractText(fileBuffer: Buffer, mimeType: string): Promise<string>
```

### `app/api/llm/route.ts`

Endpoint OpenAI-compatible que Vapi llama como custom LLM. Inyecta contexto (Red Team + transcripción) al system prompt.

## Variables de entorno

Ver `.env.example` para la lista completa.

## Consideraciones de latencia

Puntos donde importa la latencia:

1. **Red Team**: acepta 15-30 seg. Mostrar mensajes rotantes.
2. **Vapi speech-to-text**: <500ms. Ya optimizado.
3. **LLM response para el jurado**: crítico. Debe ser <2 seg idealmente.
   - Usar streaming en `/api/llm`
   - Vapi arranca a hablar tan pronto como llegan los primeros tokens
   - Modelo rápido: `claude-sonnet-4-5` o `gpt-4o` (no usar modelos "thinking")
4. **ElevenLabs TTS**: <1 seg para arrancar. Ya optimizado.
5. **Tavily**: 2-4 seg. Aceptable porque es UN solo momento (Chaos), no cada turno.

Total round-trip esperado (usuario termina de hablar → jurado empieza a hablar): **2-4 seg**. Aceptable.

## Estrategia de tolerancia a fallos

- **LLM cae** → fallback a otro provider (Claude → OpenAI o viceversa)
- **Vapi cae** → mensaje "sistema de voz no disponible, intenta más tarde" + botón retry
- **Tavily cae** → competidor hardcodeado del escenario (Yoodli para presentaciones, ChatGPT para AI, etc.)
- **ElevenLabs cae** → fallback a Vapi default voices (menos épico pero funciona)
- **Convex cae** → dead in the water, pero es sponsor y no debería
- **Todo cae** → activar "modo demo pre-grabada" (video backup)
