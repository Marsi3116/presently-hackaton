# Descripción para la submission

Copia desde la línea punteada hacia abajo y pégala en el campo *Description*
del formulario. Está en Markdown, que el campo soporta.

**Antes de pegar, mira la última línea:** el dato marcado con `[COMPLETAR]` es
el único que no puedo verificar por ti. Si no llegas a tenerlo, **bórralo** en
vez de inventarlo — es exactamente lo que la app castiga en los pitches
ajenos.

────────────────────────────────────────────────────────────────────

## El problema

Ninguna presentación falla porque las diapositivas tenían la fuente
equivocada. Falla cuando alguien hace **la pregunta que no esperabas**.

Las herramientas actuales — Yoodli, Poised, Orai — te analizan a ti: cuántas
muletillas dijiste, si hablaste rápido, si miraste a cámara. Son espejos.
Ninguna simula al que te va a cuestionar.

## Cómo funciona

1. **Subes tu presentación** (PDF, PPTX o DOCX). Se extrae el texto marcando
   cada diapositiva. Opcionalmente adjuntas la rúbrica con la que te van a
   evaluar — sirve una foto de la pizarra, la leemos con visión.
2. **Un red team la analiza** y devuelve un *Presentation Readiness Score*,
   las debilidades **citadas por diapositiva con el texto textual**, y las
   preguntas que probablemente te hagan con su porcentaje.
3. **Presentas en vivo**, por voz o por texto. El jurado escucha sin
   interrumpir mientras se mide tu ritmo, tus muletillas y tus pausas.
4. **Empieza el Q&A**: un jurado con voz te interroga sobre esas debilidades.
   Si respondes con generalidades, insiste hasta que des el número.
5. **A mitad del Q&A aparece un competidor real**, buscado en la web en ese
   momento. Tienes 30 segundos para diferenciarte.
6. **After Action Report**: qué funcionó, qué falló, y si dejaste partes de tu
   material sin exponer.

## Lo que la distingue

**Cita la diapositiva exacta con el texto literal.** No dice "falta claridad".
Dice: *diapositiva 4, el claim de reducción del 43% no tiene evidencia*, y
transcribe la frase.

**El competidor del Chaos Event es real.** Se busca en la web durante la
sesión, no está en una lista. Probando con nuestro propio pitch encontró
**Presentations AI** en 8.4 segundos y armó el mensaje nombrándolo.

**Evalúa contra tu rúbrica, no contra criterios genéricos.** Si subes los
criterios con los que te van a calificar, el análisis los usa y te dice cuál
estás incumpliendo.

**Detecta si no cubriste tu propio material.** Compara lo que dijiste contra
lo que tu presentación decía. Si te saltaste tres diapositivas, lo marca como
prioridad alta.

**Mide la forma de hablar sin tocar audio.** Ritmo en palabras por minuto,
muletillas por cada 100 palabras y pausas de más de 2 segundos, todo desde la
transcripción. Distingue "este proyecto" (demostrativo legítimo) de "este,
entonces" (titubeo).

**Modo texto como respaldo real.** Si la voz falla o se acaban los créditos,
el mismo jurado sigue por escrito con el mismo contexto. Cuesta cuatro veces
menos y no consume nada del pipeline de voz.

## Por qué la construimos

Porque el problema nos pasa a nosotros. En una defensa o un pitch, lo que
hunde no es la diapositiva fea: es quedarse callado ante una pregunta
razonable que nadie te hizo antes.

Y porque queríamos algo que se pudiera probar sobre sí mismo. Corrimos
Presently sobre nuestra propia presentación y nos dio **58 sobre 100**, con
dos debilidades críticas: un claim del 77% sin fuente en la diapositiva 4 y
falta de validación del prototipo en la 12. La primera pregunta que predijo,
con 90% de probabilidad, fue *"¿de dónde proviene ese 77%?"*.

Una herramienta que encuentra los huecos de su propia presentación es más
convincente que cualquier explicación.

## Stack

- **Next.js 16** (App Router) + TypeScript estricto
- **Tailwind CSS v4** + shadcn/ui
- **Convex** — base de datos, storage y backend functions
- **Clerk** — auth
- **Vapi** (orquestación de voz) + **Deepgram** (STT) + **OpenAI TTS**
- **GPT-4o / Claude Sonnet**, intercambiables por variable de entorno
- **Tavily** — búsqueda web
- **pdf-parse** y **officeparser** — extracción de documentos
- **Vercel** — hosting

Convex se usa como backend real, no como base de datos pasiva: reactividad con
`useQuery`, storage de archivos y actions para las llamadas externas.

## Problemas que nos encontramos

**Vapi nunca alcanzaba nuestro endpoint.** Las llamadas de voz terminaban con
`error-providerfault-custom-llm-llm-failed` y cero turnos, pero el endpoint
respondía perfecto a mano. Vapi trata la URL del custom LLM como **base** y le
agrega `/chat/completions`, igual que haría con la API de OpenAI. Pegaba a una
ruta que devolvía 404. Se resolvió con un catch-all.

**El Chaos Event apagaba el micrófono del usuario.** `vapi.setMuted(true)`
desactiva el audio **local**, no el del asistente. Queríamos callar al jurado
durante el overlay y estábamos silenciando a quien tenía que responder, así
que los 30 segundos se grababan vacíos. La llamada correcta era el control
`mute-assistant`.

**Los errores del LLM no se lanzaban.** El AI SDK solo lanza los errores que
cortan la conexión; un 429 por límite de tokens simplemente termina el stream
vacío. El endpoint devolvía SSE válido pero sin texto, y Vapi cortaba la
llamada. Ahora hay un `onError` y una respuesta de emergencia para que el
jurado nunca se quede mudo en vivo.

**pdfjs no cargaba en producción.** `pdf.mjs` crea un `DOMMatrix` a nivel de
módulo y Node no trae ese global. pdfjs tiene su propio polyfill pero lo
resuelve con un `require` que dentro del bundle de Next no resuelve, así que
se saltaba en silencio. El bug no aparecía con scripts sueltos, solo dentro de
la app.

**Vercel corta los bodies en 4.5 MB.** Un PPTX con imágenes lo pasa fácil: el
nuestro pesa 14 MB. El archivo ahora va del navegador directo a Convex Storage
y el servidor lo baja de ahí para extraer el texto.

**Las citas de página salían corridas en uno.** pdf-parse cierra cada página
con `-- 1 of 8 --`, o sea **después** del contenido, así que el modelo
atribuía cada bloque al marcador anterior: el claim de la página 4 se
reportaba como página 3. Citar la diapositiva correcta es el núcleo del
producto, así que se reordenaron los marcadores para que encabecen.

## Resultados y métricas

**Medido sobre nuestro propio pitch** (12 diapositivas, 4.492 caracteres):
score 58, dos debilidades críticas citadas con el texto literal, y tres
preguntas probables. La de mayor probabilidad (90%) apuntaba al único número
del pitch que no tenía fuente.

**Extracción verificada** sobre archivos reales: PPTX de 57 diapositivas, PDF
de 92 páginas, PPTX de 14 MB. Tiempo de extracción entre 100 y 800 ms.

**Análisis de habla**, sobre dos guiones con el mismo contenido:

| | Ritmo | Muletillas | Pausas largas |
|---|---|---|---|
| Contado mal | 100 ppm (lento) | 21.8 por 100 palabras | 2 |
| Contado bien | 133 ppm (adecuado) | 0 | 0 |

**Costo por simulación**, medido sobre una llamada real: **USD 0.0622 por
minuto de voz**. Una sesión completa de 5 minutos cuesta cerca de USD 0.48 con
voz, y USD 0.13 en modo texto.

`[COMPLETAR]` Lo probamos con N equipos del hackathon. Encontró M debilidades,
y N de ellas el propio equipo reconoció como reales.

---

**Demo:** https://presently-hackaton.vercel.app
**Código:** https://github.com/Marsi3116/presently-hackaton
