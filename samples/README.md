# Material de prueba

Generado con `node scripts/make-samples.mjs`.

| Archivo | Para que sirve |
|---|---|
| `deck-demo.pdf` | Pitch de 8 paginas con 7 fallas plantadas |
| `rubrica-demo.pdf` | Rubrica como documento |
| `rubrica-demo.png` | La misma rubrica como foto, para probar el camino de vision |

## Fallas plantadas en el deck

Cada una corresponde a un `type` de `prompts/red-team.md`:

| Pagina | Tipo | Que planta |
|---|---|---|
| 2 | `unsupported_claim` | "El 87% pierde 3 horas diarias", sin fuente |
| 3 | `undefined_term` | "RAG agentico multimodal", jerga sin definir |
| 4 | `unsupported_claim` | "Reducimos un 43%", sin metodologia ni baseline |
| 5 | `false_uniqueness` | "Somos los unicos", con Notion/Linear/Asana en el mercado |
| 6 | `contradiction` | "miles de usuarios activos" contra los "200 en beta" de la pagina 4 |
| 7 | `narrative_gap` | Nunca se explica como funciona ni hay demo |
| 8 | `missing_evidence` | Freemium sin un solo numero de precio |

## Resultado esperado

El Red Team devuelve **3-4 debilidades**, no las 7: `prompts/red-team.md`
le pide priorizar en vez de enumerar todo. Que salgan siempre las mismas 4
no es un bug.

Lo que si tiene que cumplirse:

- **El score ronda 55-60.** Un deck asi no puede dar 80.
- **Las citas de pagina son exactas.** Si el 43% sale como "Slide 3" en vez
  de "Slide 4", se rompio `markPages()` en `lib/parse-ppt.ts`.
- **Los `excerpt` son texto literal del PDF**, no parafraseo.
