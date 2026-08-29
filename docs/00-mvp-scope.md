# MVP Scope — Definitivo

Este documento es la fuente de verdad del scope. Si algo no está aquí, no se construye durante el hackathon.

## Lo que SÍ construimos

### 1. Upload de contenido
- Drag & drop de PPT o PDF
- Validación de tamaño (máx 50 MB) y formato
- Guardado en Convex Storage
- Extracción de texto en el backend

### 2. Red Team Report
- Análisis del contenido con LLM (Claude Sonnet o GPT-4o)
- Detección de 3-4 debilidades específicas citadas por slide/página
- Presentation Readiness Score (0-100)
- Lista de "preguntas probables" con porcentaje
- Persistido en Convex

### 3. Presentación en vivo
- Split screen: slide actual + avatar del jurado
- Transcripción en tiempo real (via Vapi)
- Timer visible
- Botón "siguiente slide"
- Estado visible del jurado (escuchando / pensando / hablando)

### 4. Q&A adversarial con voz
- Jurado con voz (TTS de OpenAI vía Vapi)
- Preguntas basadas en Red Team + lo que dijo el usuario
- Follow-ups si la respuesta fue floja (LLM decide)
- 2-3 intercambios antes del Chaos Event

### 5. Chaos Event — Competitor Attack
- Único evento del MVP
- Búsqueda de competidor real con Tavily
- Overlay dramático (fondo carmín, timer 30 seg)
- Mensaje: "[Competidor] acaba de anunciar tu feature. 30 segundos para diferenciarte."

### 6. After Action Report
- Timeline horizontal con puntos verdes/amarillos/rojos
- Click en momento crítico → detalle multimodal
- Score global + 3 recomendaciones concretas
- Botón "Practicar de nuevo"

### 7. Tres escenarios en dropdown
- **Pitch de hackathon** (HERO, completamente pulido)
- **Defensa de tesis** (funcional, sin optimizar)
- **Pitch a inversionistas** (funcional, sin optimizar)

Cada uno con su prompt de sistema distinto y su voz de jurado distinta.

## Lo que NO construimos — LEER ANTES DE ARRANCAR

Estos ítems son tentaciones que pueden aparecer durante el hackathon. Están descartados:

### ✗ Visión por computadora
Ni gaze, ni postura, ni gesticulación. Cuesta caro implementar, no es verificable en la demo, y no agrega al gancho del pitch. Se menciona en el roadmap del pitch, no se implementa.

### ✗ Corrección en vivo mientras el usuario presenta
Sin pop-ups, sin interrupciones, sin correcciones inline. El análisis pasa **post-hoc** (después de que termina de hablar). El Q&A adversarial ya da la sensación de presión sin los problemas de latencia y falsos positivos.

### ✗ Múltiples jurados discutiendo entre sí
Un solo personaje por escenario. La orquestación de mesa multi-persona queda para v2.

### ✗ Entrenamiento adaptativo entre sesiones
El sistema no aprende de sesiones anteriores. Cada intento es independiente. Se menciona en el pitch como diferenciador futuro.

### ✗ Chaos Events adicionales
Solo Competitor Attack. Time Cut, CEO Mode, Demo Failure, Evidence Challenge, Skip Slides — todos van en la lámina de roadmap, no se implementan.

### ✗ Replay con video sincronizado
El timeline muestra audio + slides + análisis, sin video del usuario. Cámara no se usa durante el MVP.

### ✗ Multi-archivo en el upload
Un solo PPT o PDF por sesión. Nada de "sube tu PPT + business plan + market research".

### ✗ Modo tutor / feedback silencioso
Solo modo simulación. El "modo tutor" queda para v2.

### ✗ Historial de sesiones / dashboard
Cada sesión existe pero no se muestra un historial navegable. Se guarda en Convex para futuro pero la UI no lo expone.

### ✗ Escenarios adicionales
Solo los 3 declarados. Nada de "venta a cliente", "entrevista técnica", "demo de producto" ni ninguna otra opción.

### ✗ Análisis de emociones
No decimos "estás nervioso". Solo señales observables (velocidad de habla, pausas, etc.) cuando las mostremos.

## Regla de escape

Si a mitad del hackathon alguien propone agregar algo que no está en "Lo que SÍ construimos", la respuesta por defecto es **NO**.

Si genuinamente parece crítico, aplicar este test:
1. ¿Está en el guion de la demo? (`docs/02-demo-script.md`)
2. Si lo sacamos, ¿el pitch pierde algo esencial?
3. ¿Cuesta menos de 30 min implementar?

Si las tres respuestas son SÍ, entonces se puede considerar. Si alguna es NO, se descarta.

## Prioridad de recorte

Si en hora 9 no está todo, cortar en este orden (arriba primero):

1. Los 2 escenarios extra (dejar solo Pitch de hackathon)
2. Pulir el After Action Report (dejarlo funcional pero simple)
3. Chaos Event (hardcodear competidor si Tavily falla)
4. Animaciones y polish visual

**Nunca cortar**: Red Team Report, presentación con voz, Q&A adversarial. Sin esas 3 cosas no hay demo.
