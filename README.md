<div align="center">

# Presently

**No practiques tu presentación. Sobrevívela.**

Simulador adversarial de presentaciones.
Subes tu presentación, un red team encuentra lo que no cierra, y un jurado con voz te lo pregunta en vivo hasta romperte.

### ▸ [presently-hackaton.vercel.app](https://presently-hackaton.vercel.app)

`The Next Craft 2026` · Track **Out of the Box**

</div>

---

## El problema

Ninguna presentación falla porque PowerPoint tenía la fuente equivocada.
Fallan cuando alguien hace **la pregunta que no estabas preparado para responder**.

Yoodli, Poised y Orai te analizan a ti: muletillas, ritmo, contacto visual.
Ninguna simula al que te va a destruir.

## Cómo funciona

| | Etapa | Qué pasa |
|---|---|---|
| `01` | **Upload** | Subes el PPT o PDF. Se extrae el texto, marcando cada slide o página. Puedes adjuntar la rúbrica con la que te evalúan — incluso como foto. |
| `02` | **Red Team** | Un LLM analiza el contenido y devuelve debilidades **citadas por slide con el texto textual**, un *Presentation Readiness Score* y las preguntas más probables con su porcentaje. |
| `03` | **Presentación** | Presentas en vivo, por voz o por texto. Transcripción en tiempo real, cronómetro, y el jurado escuchando. |
| `04` | **Q&A adversarial** | El jurado pregunta usando el Red Team y lo que acabas de decir. Si respondes flojo, insiste. |
| `05` | **Chaos Event** | A mitad de camino aparece un competidor **real**, buscado en la web en el momento. Tienes 30 segundos para diferenciarte. |
| `06` | **After Action Report** | Timeline de la sesión, score global, y si omitiste partes de tu material también te lo dice. |

## Demostración rápida

En `samples/` hay material listo para probar sin preparar nada:

```bash
npm run samples      # genera los archivos de muestra
```

| Archivo | Qué contiene |
|---|---|
| `deck-demo.pdf` | Pitch de 8 páginas con **7 fallas plantadas**, una por cada tipo que el sistema detecta |
| `rubrica-demo.pdf` | Rúbrica como documento |
| `rubrica-demo.png` | La misma rúbrica como foto, para ejercitar la lectura por visión |
| `pitch-malo.txt` / `pitch-bueno.txt` | Guiones de ~35s para leer en voz alta y comparar scores |

Sobre ese deck el análisis devuelve score **58**, y cita el claim del 43% en la
Slide 4 y la falsa unicidad en la Slide 5, con el texto exacto de cada una.

## Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript estricto |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Backend, base de datos y storage | Convex |
| Auth | Clerk |
| Voz del jurado | Vapi (orquestación + STT) + OpenAI TTS |
| LLM | GPT-4o / Claude Sonnet, intercambiables por env var |
| Búsqueda web | Tavily |
| Hosting | Vercel |

## Arrancar

Necesitas **Node 20.16+** (recomendado 22, ver [Notas](#notas)).

```bash
git clone https://github.com/Marsi3116/presently-hackaton
cd presently-hackaton
npm install

cp .env.example .env.local   # completa las claves

npx convex dev               # terminal 1 — crea el proyecto y aplica el schema
npm run dev                  # terminal 2 — http://localhost:3000
```

### Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Las bloqueantes:

```bash
NEXT_PUBLIC_CONVEX_URL          # la genera `npx convex dev`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
LLM_PROVIDER                    # "openai" | "anthropic"
OPENAI_API_KEY                  # o ANTHROPIC_API_KEY
NEXT_PUBLIC_VAPI_PUBLIC_KEY     # solo para el modo voz
TAVILY_API_KEY
```

### Tres pasos de setup que no son obvios

1. **JWT template en Clerk.** Crea uno llamado exactamente `convex`, con claim
   `aud: "convex"`. Sin eso, la app queda **silenciosamente deslogueada** del
   lado del backend, sin ningún error visible.

2. **Las variables del LLM van también en Convex.** Las actions corren en la
   nube de Convex y no leen tu `.env.local`:
   ```bash
   npx convex env set LLM_PROVIDER=openai
   npx convex env set OPENAI_API_KEY=<tu-key>
   npx convex env set CLERK_JWT_ISSUER_DOMAIN=https://<instancia>.clerk.accounts.dev
   ```

3. **Vapi trata la URL del custom LLM como base** y le agrega
   `/chat/completions`. Por eso `/api/llm` es un catch-all: si fuera una ruta
   fija, Vapi recibiría un 404 y cortaría la llamada sin un solo turno.

## Estructura

```
app/
├── (app)/              # rutas con sesión — el guard vive en su layout
│   ├── new/            # configurar la simulación
│   ├── upload/         # subir presentación y rúbrica
│   ├── red-team/       # el análisis adversarial
│   ├── present/        # simulación en vivo, voz o texto
│   └── report/         # After Action Report
├── api/
│   ├── analyze/        # extracción de texto y disparo del análisis
│   └── llm/            # el cerebro del jurado (lo consume Vapi)
└── page.tsx            # landing
components/             # ui/ de shadcn, customizado con los tokens propios
convex/                 # 8 módulos: schema, sesiones, uploads, red team…
lib/                    # llm, red-team, chaos, tavily, parsers
docs/                   # scope, flujo, diseño, arquitectura, manual, costos
prompts/                # los 7 prompts del sistema
samples/                # material de prueba
proxy.ts                # middleware de Clerk (en Next 16 se llama proxy)
```

## Documentación

| | |
|---|---|
| [`docs/00-mvp-scope.md`](docs/00-mvp-scope.md) | Qué se construye y qué explícitamente no |
| [`docs/01-user-flow.md`](docs/01-user-flow.md) | Las pantallas en detalle |
| [`docs/02-demo-script.md`](docs/02-demo-script.md) | Guion de la demo de 3 minutos |
| [`docs/03-design-system.md`](docs/03-design-system.md) | Paleta, tipografía, componentes y reglas de copy |
| [`docs/04-architecture.md`](docs/04-architecture.md) | Arquitectura y flujo de datos |
| [`docs/05-tools-and-credits.md`](docs/05-tools-and-credits.md) | APIs, autenticación y cuotas |
| [`docs/06-pitch.md`](docs/06-pitch.md) | El pitch |
| [`docs/07-manual-de-usuario.md`](docs/07-manual-de-usuario.md) | **Manual de usuario**: el recorrido completo y qué hacer en cada pantalla |
| [`docs/08-servicios-y-costos.md`](docs/08-servicios-y-costos.md) | Qué servicio se activa cuándo, su fallback, y el costo por simulación |
| [`docs/09-rubrica-y-autoevaluacion.md`](docs/09-rubrica-y-autoevaluacion.md) | La rúbrica del hackathon y dónde estamos contra cada criterio |
| [`docs/10-guion-demo-3min.md`](docs/10-guion-demo-3min.md) | El guion minuto a minuto de la demo, calibrado contra la rúbrica |
| [`docs/11-descripcion-submission.md`](docs/11-descripcion-submission.md) | Texto listo para pegar en el formulario de entrega |
| [`DEPLOY.md`](DEPLOY.md) | Desplegar en Vercel + Convex |

## Diseño

Estética **operational brief**: dossier de análisis de riesgos, no SaaS.
Dark mode fijo — la app se usa mientras alguien presenta y no debe distraer.

<table>
<tr>
<td><code>#0E0D0B</code></td><td>fondo, negro cálido</td>
<td><code>#EFEAD8</code></td><td>tinta cream</td>
</tr>
<tr>
<td><code>#D63B32</code></td><td>carmín — crítico, chaos</td>
<td><code>#E5A03A</code></td><td>ámbar — warning</td>
</tr>
<tr>
<td><code>#4A9E97</code></td><td>teal — ok</td>
<td><code>#3A3730</code></td><td>hairlines</td>
</tr>
</table>

Space Grotesk (display) · Inter (UI) · JetBrains Mono (stats y labels).
Radius cero en contenedores, 2px máximo en controles.

El sistema completo está en [`docs/03-design-system.md`](docs/03-design-system.md).

## Notas

- **Next.js 16 renombró `middleware.ts` a `proxy.ts`.** La documentación de
  terceros que todavía diga `middleware.ts` está desactualizada.
- **Node 22 recomendado.** `officeparser` arrastra `pdfjs-dist@6`, que declara
  `node >= 22`. En Node 20 funciona igual, con warnings al instalar.
- **pdfjs necesita `DOMMatrix`**, que Node no trae. `lib/pdf-globals.ts` lo
  instala antes de cada import; sin eso el módulo no carga y ninguna subida
  funciona.
- **`convex/_generated/` está versionado** para que el repo typechequee recién
  clonado. Se regenera con `npx convex dev`.

## Licencia

[MIT con requisito de atribución](LICENSE). Puedes usarlo, modificarlo y
distribuirlo libremente, **citando a la autora y enlazando a este
repositorio** de forma visible.

Para trabajos académicos:

> Figueroa, M. (2026). *Presently: adversarial presentation simulator.*
> https://github.com/Marsi3116/presently-hackaton

---

<div align="center">
<sub>Construido en 12 horas para The Next Craft 2026.</sub>
</div>
