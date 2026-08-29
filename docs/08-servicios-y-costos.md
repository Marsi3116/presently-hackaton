# Servicios, fallbacks y costos

Qué usa Presently, cuándo se activa cada cosa, qué pasa si falla y cuánto
cuesta una simulación completa.

---

## Los servicios

| Servicio | Para qué | Cuándo se activa |
|---|---|---|
| **Vercel** | Hosting del frontend y de `app/api/` | Siempre |
| **Convex** | Base de datos, storage de archivos, funciones de backend | Siempre |
| **Clerk** | Cuentas y sesiones | Al entrar |
| **OpenAI (GPT-4o)** | Red Team, jurado, Chaos Event, reporte final | Al subir archivo y en cada turno |
| **OpenAI (gpt-4o-mini)** | Extraer el nombre del competidor de los resultados de búsqueda | Solo en el Chaos Event |
| **OpenAI (gpt-4o-mini-tts)** | La voz del jurado | Solo en modo voz |
| **Deepgram** *(vía Vapi)* | Transcribir lo que dices | Solo en modo voz |
| **Vapi** | Orquesta la conversación: turnos, audio, interrupciones | Solo en modo voz |
| **Tavily** | Buscar el competidor real del Chaos Event | Una vez por sesión |
| **Anthropic** | Configurado como alternativa de LLM, hoy inactivo | Solo si cambias `LLM_PROVIDER` |

**ElevenLabs quedó fuera.** La cuenta es free tier y sus voces latinas requieren
plan Creator; las 21 premade son todas de acento anglo. El TTS de OpenAI acepta
instrucciones de tono, así que a cada jurado se le pide explícitamente "español
neutro latinoamericano". Las claves siguen en `.env.example` por si se retoma.

---

## Cuándo se activa cada uno, paso a paso

```
Entrar                → Clerk
Crear sesión          → Convex
Subir presentación    → Convex Storage (directo desde el navegador)
                        Vercel extrae el texto (pdfjs / officeparser)
Rubrica (opcional)    → OpenAI GPT-4o con visión, si es una foto
Red Team              → OpenAI GPT-4o                     (1 llamada)
Simulación · voz      → Vapi + Deepgram + OpenAI + TTS    (1 llamada de LLM por turno)
Simulación · texto    → OpenAI GPT-4o                     (1 llamada por turno)
Chaos Event           → Tavily + gpt-4o-mini + GPT-4o     (1 vez)
Reporte final         → OpenAI GPT-4o                     (1 llamada)
```

---

## Fallbacks: qué pasa cuando algo falla

Ordenados por probabilidad de que ocurra.

### 1. Se acaban los créditos de voz → **modo texto**

Es lo que más rápido se agota. El switch `VOZ | TEXTO` en `/present` usa el
**mismo jurado, el mismo endpoint y el mismo contexto**: solo cambia que
escribes en vez de hablar.

No consume Vapi, ni Deepgram, ni TTS. El análisis es idéntico.

> No usamos el TTS del navegador (`speechSynthesis`) como respaldo: sus voces
> en español son robóticas y romperían la ilusión del jurado, que es justo lo
> que sostiene la demo. Texto sin voz se lee mejor que voz mala.

### 2. El modelo no responde → **respuesta de emergencia**

Si OpenAI devuelve un error (429 por límite, o 5xx), el AI SDK **no lanza
excepción**: el stream simplemente termina vacío. El endpoint detecta que no
salió texto y emite una línea de jurado genérica pero creíble, en vez de
dejarlo mudo.

Un jurado que insiste con algo genérico es recuperable en vivo. Un silencio de
20 segundos, no.

### 3. Tavily falla o no encuentra nada → **competidor de respaldo**

El Chaos Event nunca se cae. Si la búsqueda falla, hay una lista fija por
escenario (Yoodli para hackathon, Poised para inversionistas). El reporte
guarda `tavilyUsed: false` para saber que fue respaldo.

### 4. Convex no responde al jurado → **pregunta sin contexto**

Si `getJuryContext` falla, el jurado sigue hablando sin el Red Team report.
Pregunta de forma más genérica, pero la conversación no se corta.

### 5. La rúbrica no se puede leer → **se ignora**

El análisis continúa con criterios generales y la UI avisa. Nunca bloquea la
subida.

### 6. El Red Team falla → **la sesión queda en `failed`**

La pantalla lo dice y ofrece reintentar. Sin esto, el spinner giraría para
siempre.

### 7. El proveedor de LLM completo → **cambiar de proveedor**

`LLM_PROVIDER=anthropic` cambia todo el sistema a Claude. Requiere setear la
variable en Vercel **y** en el deployment de Convex, porque las actions corren
en su propia nube.

---

## Costos por simulación

Medido sobre una llamada real: **USD 0.0622 por minuto de voz**, con este
desglose de Vapi:

```
transport  0        (WebRTC)
stt        0.0022   Deepgram
llm        0        (lo pagamos aparte a OpenAI, no vía Vapi)
tts        0        (idem)
vapi       0.0092   la orquestación
```

### Una simulación completa de 5 minutos

| Concepto | Costo aprox. |
|---|---|
| Red Team (1 llamada, ~4K tokens) | USD 0.02 |
| Jurado, ~8 turnos de Q&A | USD 0.06 |
| Chaos Event (Tavily + 2 llamadas) | USD 0.02 |
| Reporte final (~5K tokens) | USD 0.03 |
| **Subtotal solo texto** | **≈ USD 0.13** |
| Vapi + Deepgram, 5 min de voz | USD 0.31 |
| TTS de OpenAI, ~2500 caracteres | USD 0.04 |
| **Total con voz** | **≈ USD 0.48** |

**Regla práctica:** una simulación con voz cuesta cerca de **medio dólar**. En
modo texto, alrededor de **13 centavos** — casi cuatro veces menos.

Para una demo de hackathon con 10-15 ensayos, hablamos de USD 5 a 7 en total.

### Lo gratis

| Servicio | Límite del plan gratis |
|---|---|
| Vercel Hobby | uso no comercial |
| Convex | 1 GB storage, 1M funciones/mes |
| Clerk | 10.000 usuarios activos/mes |
| Tavily | 1.000 búsquedas/mes |

Nada de eso se agota en un hackathon.

---

## El límite que sí importa: 30.000 tokens por minuto

La cuenta de OpenAI está en **Tier 1**: 500 peticiones y **30.000 tokens por
minuto**. En modo voz el jurado hace una llamada por turno, y los turnos son
seguidos.

Por eso el contexto que se le manda va **resumido** y no como JSON crudo: las
cinco debilidades principales, las cuatro preguntas más probables y los
últimos seis turnos del Q&A. Mandar el reporte completo en cada turno agotaba
la cuota a mitad de conversación y dejaba al jurado mudo.

Si aun así aparece el límite: espera un minuto, o sube de tier en
https://platform.openai.com/settings/organization/limits.

---

## Cómo verificar que todo está vivo

```bash
# El jurado responde
curl -X POST https://presently-hackaton.vercel.app/api/llm \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Reducimos costos un 43%"}]}'

# Las llamadas de voz y por qué terminaron
curl -H "Authorization: Bearer $VAPI_API_KEY" "https://api.vapi.ai/call?limit=5"

# El límite de OpenAI que te queda
curl -D - -o /dev/null -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"hi"}],"max_tokens":1}' \
  | grep -i ratelimit
```

En el registro de llamadas de Vapi, el campo `endedReason` es lo que dice qué
pasó de verdad. `error-providerfault-custom-llm-llm-failed` significa que
nuestro endpoint no devolvió texto, no que falte el micrófono.
