# Design System

## Filosofía visual

**Estética: operational brief táctico.** No es un SaaS más. La app se llama Presently, tiene "Red Team", "Chaos Mode", "Adversarial audience" — la UI debe reflejar eso.

Referencias mentales: dossier de análisis de riesgos, mission control, terminal técnica bien diseñada. NO: gradientes suaves, ilustraciones tipo Notion, o el look "Anthropic warm cream" que se está volviendo default de las apps generadas con IA.

## Modo por defecto: DARK

La app se usa mientras alguien está presentando. Dark mode reduce distracción visual y da la sensación de "sala de operaciones". El único momento donde hay algo claro es el Chaos Event (fondo carmín pleno).

## Paleta

### Base (dark mode)

```css
--bg:              #0E0D0B;  /* negro cálido, no puro #000 */
--bg-elevated:     #1A1815;  /* cards, panels */
--bg-input:        #23201C;  /* inputs, dropdowns */
--border:          #3A3730;  /* bordes hairline */
--border-strong:   #5C574D;  /* bordes de énfasis */

--ink:             #EFEAD8;  /* texto principal — cream, no blanco puro */
--ink-soft:        #C4BFAD;  /* texto secundario */
--ink-muted:       #8B8474;  /* texto meta, labels */
```

### Acentos

```css
--crimson:         #D63B32;  /* CRÍTICO — errores, chaos, alertas */
--crimson-dim:     #8A2723;  /* variante para bg tintado */
--crimson-glow:    rgba(214, 59, 50, 0.15);  /* auras, halos */

--teal:            #4A9E97;  /* OK, positivo, éxito */
--teal-dim:        #2E5E5A;

--amber:           #E5A03A;  /* WARNING */
--amber-dim:       #B87A1E;

--olive:           #7A8B5A;  /* estado secundario positivo */
```

### Uso semántico

- **Crimson**: momentos críticos, chaos event, debilidades marcadas, timers en última cuenta regresiva, badge "CRITICAL"
- **Amber**: warnings, "atención", debilidades medias, badge "WARNING"
- **Teal**: éxito, "OK", scores altos, estado "escuchando"
- **Ink cream sobre bg negro**: 90% del texto

## Tipografía

### Familias

```css
/* Display — para títulos, hero, section headers */
font-family: 'Space Grotesk', -apple-system, sans-serif;
/* Weights: 500, 600, 700 */

/* Body / UI — para todo lo demás */
font-family: 'Inter', -apple-system, sans-serif;
/* Weights: 400, 500, 600 */

/* Mono — para labels, stats, timers, código, panels técnicos */
font-family: 'JetBrains Mono', ui-monospace, monospace;
/* Weights: 400, 500, 700 */
```

### Type scale

```css
--text-xs:    11px;   /* labels mono */
--text-sm:    13px;   /* meta, chips */
--text-base:  15px;   /* body default */
--text-lg:    17px;   /* body énfasis, lead paragraphs */
--text-xl:    22px;   /* subtítulos */
--text-2xl:   28px;   /* section titles */
--text-3xl:   40px;   /* page titles */
--text-4xl:   56px;   /* hero */
--text-5xl:   88px;   /* SCORE grande, TIMER grande */
```

### Reglas

- **Display siempre con tracking negativo**: `letter-spacing: -0.02em`
- **Mono para labels siempre uppercase**: `text-transform: uppercase; letter-spacing: 0.12em`
- **Body en sentence case**, nunca ALL CAPS
- **Scores y timers en Space Grotesk** (no mono), weight 700, tracking negativo fuerte

## Espaciado

Basado en múltiplos de 4:

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

## Bordes y radius

**Regla dura**: cero border-radius en cards y contenedores. Máximo 2px en botones, inputs, chips.

```css
--radius-none:  0;
--radius-sm:    2px;   /* botones, inputs, chips */
--radius-md:    4px;   /* solo excepciones muy puntuales */
```

Los bordes redondos hacen que la UI se vea "friendly consumer app". Queremos "control room".

## Componentes clave

### Botones

**Primario**:
- bg: `--crimson`
- text: `--ink` (cream)
- padding: `12px 24px`
- border-radius: `2px`
- font: Inter 600, 14px
- letter-spacing: 0.02em
- hover: bg oscurece a `--crimson-dim`, sin scale

**Secundario**:
- bg: transparent
- border: `1.5px solid --border-strong`
- text: `--ink`
- mismos paddings
- hover: bg `--bg-elevated`, border `--ink-muted`

**Tertiary / ghost**:
- solo texto con underline en hover

### Cards

```css
background: var(--bg-elevated);
border: 1px solid var(--border);
padding: 24px;
border-radius: 0;
```

Cards importantes agregan una barra superior o lateral en color:
- Barra superior 3px de `--crimson` = "crítico"
- Barra izquierda 4px de `--teal` = "positivo"
- Barra izquierda 4px de `--amber` = "atención"

### Chips / Badges

```css
padding: 3px 8px;
font: JetBrains Mono 500, 10px;
letter-spacing: 0.15em;
text-transform: uppercase;
border-radius: 2px;
```

Variantes:
- `CRÍTICO`: bg `--crimson-dim`, text `--crimson`, border `1px solid --crimson`
- `WARNING`: bg tint amber, text `--amber`, border amber
- `OK`: bg tint teal, text `--teal`
- `NEUTRO`: bg `--bg-input`, text `--ink-muted`

### Labels de sección (eyebrow labels)

```css
font: JetBrains Mono 500, 11px;
letter-spacing: 0.15em;
text-transform: uppercase;
color: var(--crimson);
```

Ejemplo: `SEC 01 · UPLOAD` o `▸ ANÁLISIS COMPLETADO`

### Inputs

```css
background: var(--bg-input);
border: 1px solid var(--border);
border-radius: 2px;
padding: 12px 16px;
color: var(--ink);
font: Inter 400, 15px;

/* focus */
border-color: var(--ink-muted);
outline: 2px solid var(--crimson-glow);
outline-offset: 0;
```

### Timeline (After Action Report)

- Track horizontal de 4px, `--border`
- Puntos: 16px, redondos, con borde de 3px del color del estado
- Momentos críticos animan con pulse sutil
- Al hover, el punto crece 20%

### Estado del jurado (avatar)

- Círculo o cuadrado 200-300px de tamaño
- Borde de 2px, color según estado
- Dot indicador arriba a la derecha:
  - Escuchando: `--teal`, pulse
  - Pensando: `--amber`, spinner
  - Hablando: `--crimson`, waveform animation

### Chaos Event Overlay

**Reglas**:
- Fullscreen, z-index máximo
- Fondo: `--crimson` PLENO (no transparente)
- Texto: `--ink` (cream sobre carmín), muy grande
- Entrada: fade-in de 200ms + subtle scale desde 0.98
- Sonido de alerta corto al aparecer (opcional, si el device tiene audio)
- Timer: Space Grotesk 700, tamaño enorme (`--text-5xl`), tabular-nums
- Cierre: fade-out 300ms

## Motion

**Menos es más**. Cero animaciones fancy tipo parallax o hover complejos.

Solo:
- **Fade-in de contenidos**: 150ms ease-out
- **Estados de botón**: bg-color 100ms
- **Timeline hover**: transform 150ms
- **Chaos Event**: como se describió arriba
- **Waveform del jurado hablando**: continua, muy sutil
- **Progress bars**: continuous, no bouncy

Respetar `prefers-reduced-motion: reduce` — desactivar todo.

## Iconografía

**Sin iconos genéricos**. Preferir:
- Símbolos técnicos: `▸ ✕ ⚠ ↓ ↑ →`
- Emojis SOLO en: Chaos Event (🔥), timeline dots (🟢🟡🔴)
- Si necesitas iconos de UI, `lucide-react` con `strokeWidth: 1.5` y color `--ink-muted`

## Tailwind config

Agregar al `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0E0D0B',
          elevated: '#1A1815',
          input: '#23201C',
        },
        ink: {
          DEFAULT: '#EFEAD8',
          soft: '#C4BFAD',
          muted: '#8B8474',
        },
        border: {
          DEFAULT: '#3A3730',
          strong: '#5C574D',
        },
        crimson: {
          DEFAULT: '#D63B32',
          dim: '#8A2723',
        },
        teal: {
          DEFAULT: '#4A9E97',
          dim: '#2E5E5A',
        },
        amber: {
          DEFAULT: '#E5A03A',
          dim: '#B87A1E',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0',
        sm: '2px',
        md: '4px',
      },
    },
  },
}
```

## Fuentes en el layout raíz

En `app/layout.tsx`, importar de Google Fonts:

```typescript
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' });
const body = Inter({ subsets: ['latin'], variable: '--font-body' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
```

## Copy

**Español neutro / peruano. Tuteo, nunca voseo.**

| Sí | No |
|----|----|
| eres, tienes, puedes | sos, tenés, podés |
| dices, sabes, evalúas | decís, sabés, evaluás |
| elige, usa, responde, devuelve | elegí, usá, respondé, devolvé |
| aquí, ustedes | acá, vosotros |

Aplica a la UI, a los docs y sobre todo a `prompts/`: esos prompts definen cómo **habla** el jurado por voz, así que el voseo ahí sale por los parlantes.

Tono táctico y corto, sin verbosidad. "Nueva presentación", no "Comenzar una nueva sesión de práctica".

## Antitesis — lo que NO hacer

- Gradientes de fondo (violeta a rosa, azul a verde, etc.)
- Border radius grandes (12px+, cero)
- Sombras suaves y difusas
- Ilustraciones vector amigables
- Emojis en labels o botones (excepto los que mencioné)
- Botones tipo "pill" totalmente redondeados
- Terracotta warm (#D97757) — es el default de apps generadas con IA
- Acid green sobre negro — otro default AI
- Backgrounds cream cálidos con serifas grandes (broadsheet look)
