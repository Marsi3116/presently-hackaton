<div align="center">

# Presently

**No practiques tu presentación. Sobrevivila.**

Simulador adversarial de presentaciones.
Subís tu deck, un red team encuentra lo que no cierra, y un jurado con voz te lo pregunta en vivo hasta romperte.

`The Next Craft 2026` · Track **Out of the Box**

</div>

---

## El problema

Ninguna presentación falla porque PowerPoint tenía la fuente equivocada.
Fallan cuando alguien hace **la pregunta que no estabas preparado para responder**.

Yoodli, Poised y Orai te analizan a vos: muletillas, ritmo, contacto visual.
Ninguna simula al que te va a destruir.

## Cómo funciona

| | Etapa | Qué pasa |
|---|---|---|
| `01` | **Upload** | Subís el PPT o PDF. Se extrae el texto en el backend. |
| `02` | **Red Team** | Un LLM analiza el contenido y devuelve debilidades citadas por slide, un *Presentation Readiness Score* y las preguntas más probables con su porcentaje. |
| `03` | **Presentación** | Presentás en vivo. Transcripción en tiempo real, timer, y el jurado escuchando. |
| `04` | **Q&A adversarial** | El jurado pregunta con voz, basándose en el Red Team y en lo que acabás de decir. Si respondés flojo, repregunta. |
| `05` | **Chaos Event** | A mitad de camino aparece un competidor **real**, buscado en vivo. Tenés 30 segundos para diferenciarte. |
| `06` | **After Action Report** | Timeline de la sesión con los momentos críticos, score global y tres recomendaciones concretas. |

## Stack

| Capa | Herramienta |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript estricto |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Backend / DB / Storage | Convex |
| Auth | Clerk |
| Voz del jurado | Vapi + ElevenLabs |
| LLM | Claude Sonnet / GPT-4o (intercambiable por env var) |
| Búsqueda web | Tavily |

## Arrancar

Necesitás **Node 20.16+** (recomendado 22, ver [Notas](#notas)).

```bash
git clone <repo> && cd presently
npm install

cp .env.example .env.local   # completá las keys

npx convex dev               # terminal 1 — crea el proyecto y aplica el schema
npm run dev                  # terminal 2 — http://localhost:3000
```

### Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Las bloqueantes:

```bash
NEXT_PUBLIC_CONVEX_URL          # la genera `npx convex dev`
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
LLM_PROVIDER                    # "anthropic" | "openai"
ANTHROPIC_API_KEY               # o OPENAI_API_KEY
VAPI_API_KEY
ELEVENLABS_API_KEY
TAVILY_API_KEY
```

### Dos pasos de setup que no son obvios

1. **JWT template en Clerk.** Creá uno llamado exactamente `convex` (claim `aud: "convex"`).
   Sin eso, Clerk no emite tokens que Convex acepte y la app queda **silenciosamente deslogueada** del lado del backend, sin ningún error visible.

2. **`CLERK_JWT_ISSUER_DOMAIN` va en Convex, no en `.env.local`.**
   Convex corre sus funciones en su propio runtime y no lee tu archivo local:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<tu-instancia>.clerk.accounts.dev
   ```

## Estructura

```
app/
├── (app)/              # rutas con sesión requerida — el guard vive en su layout
├── sign-in/            # Clerk catch-all
├── sign-up/
├── layout.tsx          # ClerkProvider → ConvexClientProvider, fuentes, dark
└── page.tsx            # landing
components/
├── ui/                 # shadcn, customizado con los tokens del design system
└── convex-client-provider.tsx
convex/
├── schema.ts           # 7 tablas
└── auth.config.ts      # issuer JWT
lib/
docs/                   # scope, user flow, design system, arquitectura, pitch
prompts/                # prompts del red team y de cada jurado
proxy.ts                # Clerk middleware (en Next 16 se llama proxy, no middleware)
```

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

## Documentación

| | |
|---|---|
| [`docs/00-mvp-scope.md`](docs/00-mvp-scope.md) | Qué se construye y qué explícitamente no |
| [`docs/01-user-flow.md`](docs/01-user-flow.md) | Las 7 pantallas en detalle |
| [`docs/02-demo-script.md`](docs/02-demo-script.md) | Guion de la demo de 3 minutos |
| [`docs/03-design-system.md`](docs/03-design-system.md) | Paleta, tipografía, componentes |
| [`docs/04-architecture.md`](docs/04-architecture.md) | Arquitectura y flujo de datos |
| [`docs/05-tools-and-credits.md`](docs/05-tools-and-credits.md) | APIs, autenticación, cuotas |
| [`docs/06-pitch.md`](docs/06-pitch.md) | El pitch |

## Notas

- **Next.js 16 renombró `middleware.ts` a `proxy.ts`.** La documentación de terceros que todavía diga `middleware.ts` está desactualizada.
- **Node 22 recomendado.** `officeparser` arrastra `pdfjs-dist@6` y `file-type@22`, que declaran `node >= 22`. En Node 20 funciona la ruta de PDF (`pdf-parse`), pero vas a ver warnings de engine al instalar.
- **`convex/_generated/` está versionado** para que el repo typechequee recién clonado. Se regenera solo con `npx convex dev`; si genera conflictos de merge, resolvelos regenerando.

---

<div align="center">
<sub>Construido en 12 horas para The Next Craft 2026.</sub>
</div>
