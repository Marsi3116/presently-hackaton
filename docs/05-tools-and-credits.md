# Tools & Credits

## Servicios que usamos

### Convex — DB + backend + storage

- **Rol**: base de datos, backend functions, storage de PPT/PDF
- **Créditos**: gratis (free tier alcanza y sobra)
- **Setup**:
  ```bash
  npm install convex
  npx convex dev
  # Sigue el wizard, autoriza con GitHub
  # Se genera automáticamente un deploy dev
  ```
- **Env vars**: `NEXT_PUBLIC_CONVEX_URL` (se llena solo)
- **Docs**: https://docs.convex.dev

### Vapi — voice AI del jurado

- **Rol**: STT del usuario + orquestación de conversación + TTS del jurado
- **Créditos**: **$50 USD** vienen con la inscripción al hackathon
- **Setup**:
  1. Crear cuenta en https://vapi.ai
  2. Copiar API key desde dashboard
  3. Crear un asistente en el dashboard (o via API):
     - Provider LLM: Custom → apuntar a nuestro `/api/llm`
     - Voice: ElevenLabs con voice ID específico
     - Language: `es`
     - Silence timeout: 8 seg
- **Env vars**: `VAPI_API_KEY`, `VAPI_ASSISTANT_ID_HACKATHON`, `VAPI_ASSISTANT_ID_THESIS`, `VAPI_ASSISTANT_ID_INVESTOR`
- **Docs**: https://docs.vapi.ai

### ElevenLabs — voces custom

- **Rol**: voces expresivas para cada jurado
- **Créditos**: **incluidos** con la inscripción (monto exacto por confirmar)
- **Setup**:
  1. Crear cuenta en https://elevenlabs.io
  2. Elegir 3 voces del catálogo (una por cada jurado):
     - Hackathon: voz masculina, tono energético, ~40 años
     - Thesis: voz femenina, tono académico riguroso, ~50 años
     - Investor: voz masculina, tono grave y escéptico, ~55 años
  3. Copiar los voice IDs
- **Env vars**: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID_HACKATHON`, etc.

### Anthropic (Claude) — LLM principal

- **Rol**: Red Team del contenido + cerebro del jurado
- **Créditos**: **NO vienen con el hackathon**. Alguien del equipo pone su key.
- **Modelo**: `claude-sonnet-4-5`
- **Costo estimado**: $10-30 para todo el hackathon
- **Setup**:
  1. Crear cuenta en https://console.anthropic.com
  2. Crear API key
  3. Cargar $20 de crédito (con eso sobra)
- **Env vars**: `ANTHROPIC_API_KEY`

### OpenAI (GPT) — LLM fallback

- **Rol**: mismo que Anthropic, pero por si falla
- **Créditos**: no vienen con el hackathon
- **Modelo**: `gpt-4o` (rápido) o `gpt-4o-mini` (más barato)
- **Setup**:
  1. Cuenta en https://platform.openai.com
  2. API key con permisos
- **Env vars**: `OPENAI_API_KEY`

### Clerk — autenticación

- **Rol**: signup/signin de usuarios
- **Créditos**: gratis (free tier permite hasta 10k MAU)
- **Setup**:
  1. Cuenta en https://clerk.com
  2. Crear app "Presently"
  3. Habilitar Google + Email
  4. Copiar keys
- **Env vars**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`

### Tavily — búsqueda web para Chaos Event

- **Rol**: buscar competidores reales para el Competitor Attack
- **Créditos**: **1000 créditos** vienen con la inscripción
- **Setup**:
  1. Cuenta en https://tavily.com
  2. API key
- **Env vars**: `TAVILY_API_KEY`

### Vercel — hosting

- **Rol**: deploy del Next.js
- **Créditos**: gratis (Hobby tier)
- **Setup**: conectar el repo de GitHub, `vercel --prod` para deploy
- **Env vars**: cargar todas las de arriba en el dashboard de Vercel

### Cursor — IDE con IA

- **Rol**: escribir código con IA en el editor
- **Créditos**: **$20 USD** vienen con la inscripción
- **Alternativa**: Claude Code (agente en terminal, cobra por API de Anthropic)

### Replit — sandbox / hosting alternativo

- **Créditos**: **Plan Core + $20 USD** vienen con la inscripción
- **Uso posible**: si Vercel no funciona por alguna razón, deploy acá

### n8n — workflows (opcional)

- **Créditos**: **1 mes de Cloud Pro** viene con la inscripción
- **Uso posible**: orquestar el trigger del Chaos Event o el reporte final, aunque no es necesario

## Créditos que NO vamos a usar (o poco)

- **Apify** ($50) — para scraping, no lo necesitamos
- **Exa** ($50) — similar a Tavily, uno de los dos alcanza
- **CloudForge AI, 3DevLabs, visagente** — no aplican al proyecto

## Timing crítico de setup

Estas cosas hay que hacer **HOY** o mañana temprano, antes de la 9 AM del sábado:

- [ ] Cuenta de Anthropic con crédito cargado (o OpenAI)
- [ ] Cuenta de Vapi con al menos 1 asistente creado y probado (30 min)
- [ ] Cuenta de Convex con deploy inicial funcionando
- [ ] Cuenta de Clerk con app creada
- [ ] Cuenta de ElevenLabs con 3 voces elegidas y probadas
- [ ] Cuenta de Tavily con API key
- [ ] `.env.local` con todas las keys
- [ ] Repo en GitHub con acceso para todo el equipo
- [ ] Deploy inicial en Vercel funcionando (aunque sea Hello World)

Si esto no está listo al arrancar, se pierden 2-3 horas de las 12 en setup, y no se llega.

## Preguntas para los organizadores (mandar HOY)

- ¿Los créditos de Vapi/ElevenLabs/Tavily se entregan al inicio del evento o hay que reclamarlos con anticipación?
- ¿Hay algún crédito de LLM (Anthropic, OpenAI, Google) que no esté listado públicamente?
- ¿Convex es requirement estricto o solo recomendación?
- ¿Cuál es la política de bring-your-own-key? (para asegurarnos de no violar nada usando cuentas propias de Anthropic)
