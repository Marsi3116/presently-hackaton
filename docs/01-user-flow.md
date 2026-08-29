# User Flow — 7 pantallas

## Principio general

- **Una acción principal por pantalla**. Nada de "y también puedes hacer X".
- **Todo pre-poblado con defaults sensatos**. El usuario NUNCA se queda pensando qué llenar.
- **La demo salta las primeras 3 pantallas en 30 segundos**. Diseñar para eso.

## Pantalla 1 — Landing

**Ruta**: `/`
**Estado**: Sin auth requerido (pero muestra Sign In si no está logueado)

**Contenido**:
- Título grande: "Presently"
- Subtitle: "Don't practice your presentation. Survive it."
- Un CTA único: `[ Nueva presentación → ]`
- Estilo: dark mode, tipografía Space Grotesk display, sensación de "operational brief"

**Acciones del usuario**:
- Click CTA → si no logueado, redirect a Clerk sign-in → después va a `/new`
- Si logueado, va directo a `/new`

**Nada más**. Sin features grid, sin testimonials, sin "how it works". Es una landing brutal.

---

## Pantalla 2 — Setup del escenario

**Ruta**: `/new`
**Estado**: Auth requerido

**Contenido**:
- Header: "Configurar simulación"
- Form vertical:
  - **Escenario**: dropdown con "Pitch de hackathon" (default), "Defensa de tesis", "Pitch a inversionistas"
  - **Duración**: chips seleccionables `[3 min]` (default) `[5 min]` `[10 min]`
  - **Objetivo**: input de texto, placeholder "Convencer al jurado de darnos el primer lugar"
- CTA: `[ Continuar → ]`

**Acciones**:
- Continuar → crea `session` en Convex → redirect a `/upload/[sessionId]`

**Tiempo esperado del usuario**: 20-30 segundos.

---

## Pantalla 3 — Upload

**Ruta**: `/upload/[sessionId]`

**Contenido**:
- Header: "Subir material"
- Dropzone grande centrada, con hint: "Arrastra tu PPT o PDF, o haz click"
- Debajo: "PPT, PPTX, PDF · máx 50 MB"
- Después de soltar el archivo:
  - Nombre del archivo + tamaño
  - Progress bar con **mensajes específicos que rotan**:
    - "Leyendo slides..."
    - "Extrayendo claims..."
    - "Buscando contradicciones..."
    - "Generando preguntas probables..."
    - "Casi listo..."

**Acciones**:
- Upload → Convex Storage → dispara action `analyzeSubmission` → cuando termina, redirect a `/red-team/[sessionId]`

**Nota técnica**: aunque el análisis del Red Team tarde 15-30 seg, los mensajes rotantes hacen que se sienta rápido y generan anticipación. Cambia el mensaje cada 3 seg.

---

## Pantalla 4 — Red Team Report (PANTALLA CLAVE #1)

**Ruta**: `/red-team/[sessionId]`

**Contenido** (layout de dos columnas en desktop, stackeado en mobile):

**Columna izquierda (60%)**:
- Big "Presentation Readiness Score" con número grande (ej. `67 / 100`)
- Debajo, 4 sub-scores en fila: Argumentación · Evidencia · Narrativa · Defendibilidad (todos con su número, con indicador visual si es bajo ⚠️)
- Sección "Debilidades detectadas":
  - 3-4 cards, cada una con:
    - Etiqueta chip (ej. "Claim sin evidencia" en amber, "Contradicción" en carmín)
    - Referencia a slide/página: "Slide 4"
    - Descripción específica y accionable
    - Cita del texto original si aplica

**Columna derecha (40%)**:
- Sección "Preguntas que probablemente te hagan":
  - 3 preguntas listadas con porcentaje de probabilidad
  - Ordenadas de mayor a menor
  - Ej: "🔥 87% — ¿Cómo calcularon el 43% de reducción?"

**Footer con dos CTAs**:
- Secundario: `[ Arreglar antes de presentar ]` (por ahora no hace nada, tooltip: "Próximamente")
- Primario: `[ Estoy listo, empezar simulación → ]` (redirect a `/present/[sessionId]`)

**Nota**: esta pantalla ya es un producto por sí sola. Si Vapi falla en la demo, con esto solo ya hay algo mostrable. Priorizar polish visual aquí.

---

## Pantalla 5 — Presentación en vivo (PANTALLA CLAVE #2)

**Ruta**: `/present/[sessionId]`

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│  ⏱ 02:14 / 03:00                    🎙 LIVE · Escuchando │
├───────────────────────────────────────────────┬───────────┤
│                                                │           │
│                                                │  [Avatar  │
│           SLIDE ACTUAL                         │   Jurado] │
│           (imagen del slide)                   │           │
│                                                │  Nombre   │
│                                                │  Rol      │
│                                                │  Estado   │
│                                                │           │
├───────────────────────────────────────────────┴───────────┤
│  📝 Transcripción en vivo:                                 │
│  "Nuestra solución reduce costos aproximadamente..."      │
│                                                            │
│              [ ← anterior ]   [ siguiente slide → ]       │
└───────────────────────────────────────────────────────────┘
```

**Estados del jurado (mostrar visualmente)**:
- **Escuchando**: avatar con dot verde pulsante
- **Pensando**: dot amber, texto "Analizando..."
- **Hablando**: dot carmín, forma de onda animada, texto "Hablando..."

**Flujo**:
1. Usuario click en "Empezar" → Vapi conecta, se establece llamada
2. Usuario habla, transcripción aparece en vivo abajo
3. Usuario cambia slides con el botón (o auto si no cambia en X seg)
4. El jurado está **muteado** durante toda la exposición: escucha y acumula
   transcripción, pero no interrumpe. En pantalla se ven las métricas de habla
   en vivo (ritmo en palabras por minuto, muletillas por cada 100 palabras y
   pausas de más de 2 segundos).
5. El usuario aprieta `[ Terminé, que pregunten → ]` o el timer llega a 0:
   - Estado del jurado cambia a "Pensando"
   - Se guarda la transcripción completa en Convex
   - Auto-scroll a la sección Q&A (siguiente pantalla, misma ruta)

---

## Pantalla 6 — Q&A adversarial + Chaos Event (DONDE VIVE LA MAGIA)

**Ruta**: mismo `/present/[sessionId]` pero en estado "qa"

**Layout similar a la anterior, con cambios**:
- Slide se hace más pequeño
- Avatar del jurado grande
- El jurado empieza a hablar (TTS de OpenAI vía Vapi)
- Debajo, la última pregunta se muestra transcrita en pantalla grande
- Usuario responde hablando (Vapi captura)
- Después de responder, jurado decide si hace follow-up (LLM decide) o pasa a la siguiente

**Después de 2-3 intercambios** → dispara Chaos Event:
- Overlay fullscreen con animación de entrada dramática
- Fondo carmín pleno
- Sonido corto de alerta
- Texto grande:
  ```
  🔥 CHAOS EVENT
  
  El equipo de [Competidor Real de Tavily] acaba de anunciar
  exactamente tu feature.
  
  Tienes 30 segundos para diferenciarte.
  ```
- Timer grande contando desde 30 seg
- Botón `[ Empezar respuesta ]` que activa el micro y arranca el timer
- Después de 30 seg (o cuando el usuario dice "terminé"):
  - Se cierra el overlay
  - Redirect a `/report/[sessionId]`

---

## Pantalla 7 — After Action Report

**Ruta**: `/report/[sessionId]`

**Contenido**:

**Sección 1 — Overall Score** (arriba):
- Score grande centrado: `76 / 100`
- Debajo, grid de sub-scores:
  - Contenido: 84
  - Argumentación: 79
  - Evidencia: 58 ⚠️
  - Comunicación: 81
  - Manejo del tiempo: 91
  - Q&A: 67
- Título de la sección: "Cómo te fue"

**Sección 2 — Timeline visual** (medio):
- Línea horizontal con puntos:
  - Verdes = todo bien
  - Amarillos = warning
  - Rojos = momento crítico
- Cada punto es clickeable
- Al clickear, se abre un panel lateral con:
  ```
  03:17 — MOMENTO CRÍTICO
  
  📊 CONTENIDO
  Claim del 43% de reducción de costos
  
  📄 EVIDENCIA
  No se encontró sustento
  
  🎤 VOZ
  Velocidad aumentó 40%
  
  👨‍💼 JURADO
  Hizo follow-up
  
  🧠 RESULTADO
  La respuesta no justificó el dato
  ```

**Sección 3 — Recomendaciones** (abajo):
- 3 recomendaciones concretas, no genéricas
- Ejemplos:
  - "Prepara la justificación exacta del 43% con: número de empresas, baseline y período de medición."
  - "Cuando te pregunten sobre metodología, no evadas — usa el marco DEDA (Datos, Ejemplo, Detalle, Aporte)."
  - "Practica la respuesta a 'por qué no lo copia Google' — es la pregunta #1 en pitches a inversores."

**CTAs al final**:
- Primario: `[ Practicar de nuevo → ]` (crea nueva session, va a `/new`)
- Secundario: `[ Descargar reporte ]` (tooltip: "Próximamente")

---

## Notas de UX transversales

- **Loading states**: nunca dejar la pantalla en blanco. Skeleton loaders o mensajes específicos.
- **Errores**: mostrar mensaje humano, no stack trace. "Algo salió mal con el jurado. Intentalo de nuevo." + botón retry.
- **Empty states**: no aplican mucho porque el flujo es lineal, pero si un usuario cae en `/report/[sessionId]` sin haber presentado, redirigir a `/new`.
- **Mobile**: la app está pensada para desktop (para la demo). Mobile debe funcionar pero no es prioridad de polish.
