# Pitch

## Pitch corto (60 segundos)

> Hoy las herramientas de IA pueden crear tus slides, corregir tu texto e incluso decirte cuántas muletillas usaste.
>
> Pero ninguna presentación falla porque PowerPoint tenía una fuente incorrecta.
>
> Fallan cuando alguien hace la pregunta que no estabas preparado para responder.
>
> **Presently entiende tu presentación, escucha cómo la defiendes, y crea una audiencia artificial que busca tus puntos débiles.**
>
> No practicamos presentaciones. **Las sobrevivimos.**

## Tácticas de venta al jurado

### Táctica 1 — El enemigo con nombre

No decir "existen otras herramientas". Nombrar:

> "Yoodli, Poised y Orai te analizan a ti. Ninguna simula al que te va a destruir."

Nombres reales hacen creíble que investigaste el mercado. Y contrastar el "te analizan a ti" con "simulamos al que te destruye" es memorable.

### Táctica 2 — Meta-move de cierre

Al final del pitch, esta línea:

> "Todo lo que ustedes acaban de ver — el análisis, el jurado, el chaos — lo construimos en 12 horas. Y lo estamos usando ahora mismo para preparar el pitch que les estamos dando."

Esto hace tres cosas:
1. Prueba que la app funciona (la usaste tú)
2. Muestra técnica (12h, no meses)
3. Cierra con humor y cercanía (auto-referencia)

### Táctica 3 — La pregunta reencuadrada

En vez de vender features, terminar con la pregunta que el producto responde:

> "No preguntamos '¿fue una buena presentación?'. Preguntamos: **'¿sobreviviría esta presentación frente a una audiencia real?'**"

Reencuadrar el problema es más fuerte que enumerar features.

### Táctica 4 — Datos duros solo si son verdaderos

Si en el ensayo pueden generar métricas reales (aunque sean modestas), usarlas:

> "En las pruebas de hoy, la app encontró 47 debilidades reales en pitches que ya habían sido revisados por humanos."

Números sin fuente son ruido. Números con fuente incluso pequeña son poderosos.

**IMPORTANTE**: nunca inventar números. Si no los tienes, decir "en beta" o "en construcción".

## Estructura del pitch de 3 min

Este es el pitch para el jurado del hackathon, distinto al guion de la demo (que ES el pitch, pero orquestado con la app funcionando en vivo).

### Estructura:

1. **Hook** (10s): "Ustedes van a ver 20 pitches hoy. Van a olvidar 18."
2. **Problema** (20s): las herramientas te ayudan a preparar, pero no a defender.
3. **Demo** (2 min 15s): usar la app en vivo — Red Team, presentación, jurado, Chaos.
4. **Cierre** (15s): meta-move + tagline final.

## Preguntas probables del jurado (prepararse)

### "¿Cómo se diferencia de Yoodli/Poised/Orai?"

> "Ellos son espejos. Nosotros somos sparring partners. Yoodli te dice cuántas muletillas usaste. Presently te muestra por qué el CFO no va a comprarte."

### "¿Cuál es el modelo de negocio?"

> "Freemium con tres tiers. El mercado más rápido de vender es B2B a universidades y aceleradoras — quieren dar a sus estudiantes o founders una herramienta antes de defensa de tesis o demo day. Venta 10x más rápida que ir usuario por usuario."

### "¿Cómo escalás el costo del LLM?"

> "Cada sesión son ~5000 tokens de input y 2000 de output. Con Claude Sonnet, cuesta ~$0.02 por sesión. Márgen brutal."

### "¿Qué pasa si el LLM se equivoca en el Red Team?"

> "Puede pasar. Por eso el usuario tiene el botón 'Arreglar antes de presentar' para revisar el análisis antes de continuar. Pero además, incluso un análisis 80% correcto es 80% más de lo que hoy tienes antes de una presentación."

### "¿Por qué en 12 horas y no en 2 meses?"

> "Porque el core del producto es un prompt y una integración de voz. El resto — persistencia, UI, auth — es plumbing. Con Convex, Vapi y ElevenLabs armás la infraestructura en un día. La calidad está en los prompts, no en el código."

### "¿Cómo garantizás que el jurado suene realista?"

> "Los prompts están hechos por perfil, con role prompting específico (CFO, jurado académico, inversor). Y el LLM tiene contexto de todo el pitch, incluyendo el Red Team. No es un chatbot genérico haciendo preguntas — es una persona con criterios que ya leyó tu material."

## Slides opcionales

Si el hackathon permite slides además de la demo, mantenerlas al mínimo:

1. **Título + tagline** (5 seg): "Presently — Don't practice. Survive."
2. **Problema** (10 seg): imagen de gente presentando con cara de terror
3. **Demo en vivo** (2 min 15 seg): full screen la app, no slides
4. **Diferenciación** (15 seg): Yoodli/Poised/Orai vs Presently (una línea cada uno)
5. **Cierre** (15 seg): tagline grande

Menos slides, más demo. La app es el pitch.
