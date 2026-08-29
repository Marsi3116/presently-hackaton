# Demo Script — 3 minutos

## Cast

- **Presentador** (habla al jurado, ejecuta la demo)
- **Operador** (opcional, cambia slides / dispara Chaos si no es automático)

## Setup previo al kickoff de la demo

- Laptop conectada a proyector, wifi estable, micro funcionando
- Sesión de Presently ya abierta en `/new`
- PPT de prueba pre-cargado en `/mnt/user-data/uploads/demo-pitch.pptx` (con fallas intencionales — ver "PPT de prueba" al final de este doc)
- Backup: video grabado de 2 min con demo funcional, listo para reproducir si algo falla
- Voz del jurado ya probada en ElevenLabs, cargando rápido

## El guion (3:00)

### 0:00–0:20 — Hook + Setup

**Presentador** (mirando al jurado):
> "Ustedes son un jurado de hackathon. En 40 minutos van a ver 20 pitches. Van a olvidar 18. Nosotros construimos algo que nos ayuda a estar en los otros 2."

*[Click en "Nueva presentación" → dropdown "Pitch de hackathon" → duración "3 min" → objetivo "Ganar The Next Craft 2026" → click "Continuar"]*

*[Drag & drop del PPT pre-cargado → progress bar arranca]*

**Presentador**:
> "Estamos subiendo nuestro propio pitch. Vamos a dejar que nuestra app lo destruya."

### 0:20–0:50 — Red Team Report

*[Aparece el Red Team Report con Readiness Score `67/100`]*

**Presentador** (señalando la pantalla):
> "En 15 segundos leyó nuestro pitch y encontró que el claim de 'reducimos costos 43%' no tiene evidencia en el material. Y que la slide 7 se contradice con la 2. Y generó las 3 preguntas que probablemente nos hagan a nosotros."

*[Zoom en una de las debilidades — leer una en voz alta para dar contexto]*

> "Esto es lo que hoy nadie te dice antes de una presentación."

*[Click en "Estoy listo, empezar simulación"]*

### 0:50–1:40 — Presento en vivo (con fallas intencionales)

*[Se abre la pantalla de presentación, avatar del jurado, transcripción en vivo]*

**Presentador** (presentando el pitch como si fuera real):
> "Presently es una plataforma que ayuda a las empresas a preparar mejor sus presentaciones. Hemos visto una reducción del 43% en el tiempo de preparación, con resultados excelentes en pruebas con clientes reales. Nuestra tecnología es única en el mercado..."

*[Deliberadamente decir el "43%" y "único en el mercado" — son las fallas plantadas]*

*[Después de ~40-50 seg, dejar que el timer expire o decir "he terminado"]*

### 1:40–2:30 — Jurado ataca

*[Avatar del jurado cambia a estado "pensando" y luego "hablando"]*

**Jurado (voz ElevenLabs, grave y firme)**:
> "Mencionaste una reducción del 43%. ¿Cómo calcularon exactamente ese número? ¿Cuántas empresas participaron y cuál era el baseline?"

**Presentador** (respondiendo mal a propósito):
> "Bueno, hicimos algunas pruebas y vimos una mejora considerable en varias empresas..."

*[Pausar, dejar que el jurado procese]*

**Jurado**:
> "Eso no explica cómo obtuvieron el 43%. Sin evidencia, ese número es opcional. Segundo tema: dijiste que son 'únicos en el mercado'. Yoodli, Poised y Orai ya operan en este espacio. ¿En qué específicamente son distintos?"

**Presentador** (mejorando la respuesta):
> "Yoodli y Poised te analizan a vos. Nosotros simulamos al que te va a destruir. Es sparring, no espejo."

*[Aquí ya el jurado real puede reaccionar — es una buena línea para landear]*

### 2:30–2:45 — 🔥 CHAOS EVENT

*[La pantalla se pone carmín pleno, sonido de alerta, texto grande]*

**Overlay**:
> 🔥 CHAOS EVENT
> 
> El equipo de **Yoodli** acaba de anunciar exactamente tu feature.
> 
> Tenés **30 segundos** para diferenciarte.

*[Timer visible corriendo]*

**Presentador** (aprovechando 10-15 seg reales frente al jurado):
> "Yoodli te dice cómo hablaste. Nosotros te muestran lo que tu audiencia va a odiar. Yoodli es feedback pasivo. Nosotros somos combate. Yoodli te da un score. Nosotros te dejamos cicatrices. Y esas cicatrices son lo que te hace mejor."

*[Timer sigue corriendo pero presentador cierra el momento]*

### 2:45–3:00 — Cierre

*[Overlay se cierra, aparece el timeline con momentos marcados]*

**Presentador** (voz calmada, seria):
> "Todo lo que ustedes acaban de ver — el análisis, el jurado, el chaos — lo construimos en 12 horas. Con Convex, Vapi, ElevenLabs y Tavily. Y lo estamos usando ahora mismo para preparar el pitch que les estamos dando."

*[Pausa dramática]*

> "No practicamos presentaciones. Las sobrevivimos."

*[Fin. Silencio. Mirar al jurado, no moverse.]*

---

## Notas de ensayo

### Practicar mínimo 3 veces completas

- **Ronda 1**: leyendo el guion, sin importar timing
- **Ronda 2**: sin el guion, cronometrando
- **Ronda 3**: con alguien haciendo de "gremlin" (baja el wifi, cierra la app, para simular fallas)

### Puntos de fallo comunes a probar

- ¿Qué pasa si Vapi tarda 8 seg en conectar? → tener frase preparada mientras carga
- ¿Qué pasa si el LLM tarda mucho en responder? → mostrar spinner y esperar en silencio, no llenar con voz
- ¿Qué pasa si el jurado dice algo raro/incoherente? → reaccionar con humor: "el jurado hoy está creativo"
- ¿Qué pasa si Tavily no encuentra competidor? → fallback hardcoded a Yoodli (elegido a propósito porque es real)

### Frases de recuperación si algo falla

- "Como pueden ver, la app también tiene sus momentos de presión."
- "Vamos a saltar a la siguiente parte de la demo."
- "Este es el punto donde normalmente sale el jurado — les dejo imaginar."

---

## PPT de prueba

Crear un PPT de 6-8 slides sobre **cualquier producto ficticio** (recomiendo un producto SaaS genérico tipo "plataforma de análisis de datos") con estas fallas intencionales:

1. **Claim sin evidencia**: "Reducimos costos 43%" sin ninguna cita, tabla o fuente
2. **Contradicción interna**: en slide 2 decir "mercado de $500M", en slide 7 decir "TAM de $50M"
3. **Término sin definir**: usar "RAG" o "LLM fine-tuning" varias veces sin explicar
4. **Falsa unicidad**: "Somos únicos en el mercado" cuando obviamente hay competidores (Yoodli, Poised, etc.)
5. **Slide de conclusión que no cierra**: termina con "gracias" sin recap ni call-to-action

Esto le da material al Red Team para que devuelva un análisis rico, y al jurado para hacer preguntas puntuales.
