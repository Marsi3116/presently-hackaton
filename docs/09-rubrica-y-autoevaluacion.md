# Rúbrica del hackathon y autoevaluación

La rúbrica oficial de **The Next Craft 2026**. Una sola para las dos fases y
los tres tracks; cada criterio se puntúa de 0 a 5 y los pesos no cambian.

| Peso | Criterio | Qué miden |
|---|---|---|
| **30%** | **Demo cerrada** | El flujo se recorre entero y termina. Nada de caminos a medias. |
| **25%** | **Uso validado** | Usuario concreto, problema real y data recogida hoy que lo demuestre. |
| **20%** | **Craft técnico** | Qué tan bien resuelto está lo que enseñaron, no qué tan grande era el reto. |
| **15%** | **Ambición** | Cómo abordaron la complejidad: qué se echaron encima y cómo lo partieron para que entrara en 12 horas. |
| **10%** | **Pitch claro** | Qué resuelve, en qué track compite, y dentro del tiempo acordado. Ni un minuto más. |

---

## Dónde estamos contra cada criterio

Autoevaluación honesta. Sirve para decidir dónde poner las horas que quedan.

### Demo cerrada — 30%, el que más pesa

**Estado: el flujo existe completo y hay que recorrerlo sin cortes.**

```
/  →  /new  →  /upload  →  /red-team  →  /present  →  /report
```

Las seis pantallas están construidas y desplegadas. Lo verificado por
ejecución: extracción de PDF y PPTX, el Red Team con citas por slide, el Chaos
Event con competidor real, el endpoint del jurado en producción, y el reporte
final detectando cobertura faltante.

**Lo que decide este 30%:** que el recorrido completo salga sin caerse en vivo.
No basta con que cada parte funcione por separado.

- Ensayar el flujo entero al menos tres veces seguidas, cronometrado.
- Tener una sesión ya terminada con su reporte, por si algo falla en vivo.
- Modo texto listo como respaldo: si la voz se corta, la demo sigue.

### Uso validado — 25%, el más flojo hoy

**Estado: es el hueco más grande.**

Tenemos la herramienta, pero *"data recogida hoy"* significa gente real que la
usó y qué salió de eso. Sin eso, este 25% se pierde casi entero.

Lo que se puede recoger en poco tiempo:

- Correr el análisis sobre presentaciones reales de otros equipos del
  hackathon y anotar las debilidades que encontró.
- Cuántas de esas debilidades el equipo dueño del pitch reconoció como reales.
- Comparar el Readiness Score antes y después de corregir.
- Una cita textual de alguien que lo usó.

Un número con fuente vale más que diez features. Y es literalmente lo que la
app le exige a sus usuarios: no hagas un claim sin evidencia.

### Craft técnico — 20%

**Estado: sólido, y hay decisiones que vale la pena contar.**

No es cuánto se construyó, sino qué tan bien resuelto está. Lo defendible:

- **Convex como backend real**, no como base de datos pasiva: reactividad con
  `useQuery`, storage de archivos, y actions para las llamadas externas.
- **La subida esquiva el límite de 4.5 MB de Vercel** yendo directo del
  navegador a Convex Storage. Un PPT con imágenes lo pasa fácil.
- **Los prompts viven en `prompts/*.md`** y se compilan a un módulo TS en el
  build: una sola fuente de verdad, editable por quien no toca código.
- **Cada salida del LLM se valida con zod** antes de tocar la base.
- **Fallback en cada punto de falla** (ver `docs/08-servicios-y-costos.md`):
  si la voz cae hay modo texto, si el modelo no responde el jurado igual
  habla, si Tavily falla hay competidor de respaldo.

### Ambición — 15%

**Estado: bien, si se cuenta cómo se partió el problema.**

Lo que se decidió NO hacer está en `docs/00-mvp-scope.md`, y esa lista es el
argumento: sin visión por computadora, sin correcciones en vivo, sin múltiples
jurados discutiendo. Un escenario pulido y dos funcionales.

El pipeline completo — analizar, conversar por voz, interrumpir con un
competidor real, y evaluar — es ambicioso para 12 horas. Lo que lo hace
defendible es haberlo recortado a un solo camino que cierra.

### Pitch claro — 10%

**Estado: escrito, falta cronometrarlo.**

`docs/06-pitch.md` tiene el pitch de 60 segundos y `docs/02-demo-script.md` el
guion de 3 minutos.

- Track: **Out of the Box**. Decirlo explícitamente.
- *"Ni un minuto más"* está en la rúbrica: pasarse resta.
- Cerrar con el meta-move: esta presentación se preparó con la propia app.

---

## Lo que la app dice de sí misma

Vale la pena correr Presently sobre el propio pitch de Presently y mostrar el
resultado. Cuando se hizo con `Presently-2.pptx`, el análisis devolvió:

```
Readiness Score: 58

[CRÍTICO] Slide 4  — Claim sin soporte sobre ansiedad
          "El 77% de las personas experimenta ansiedad al hablar en público."
[CRÍTICO] Slide 12 — Falta de validación del prototipo
[WARNING] Slide 10 — Información desorganizada

90%  ¿De dónde proviene el dato del 77% de ansiedad?
75%  ¿Qué resultados específicos obtuvieron al probar su prototipo?
```

Dos cosas útiles salen de ahí:

1. **Accionable ya**: conseguir la fuente del 77% y un número del testeo,
   porque son las dos preguntas que el jurado real va a hacer.
2. **Es la demo**: mostrar que la herramienta encuentra los huecos de su propia
   presentación prueba que funciona mejor que cualquier explicación.

---

## Cómo se usa esto dentro de la app

La rúbrica se puede subir en `/upload` como criterio de evaluación. Cuando está
cargada, el Red Team evalúa contra **estos** criterios y nombra cuál se
incumple, en vez de usar criterios generales.

Sirve el PDF, o una foto de la pantalla donde está publicada.
