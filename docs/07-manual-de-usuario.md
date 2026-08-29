# Manual de usuario

Presently te pone frente a un jurado que busca los huecos de tu presentación
**antes** de que lo haga uno de verdad.

App: **https://presently-hackaton.vercel.app**

---

## Antes de empezar

Necesitas:

- **Tu presentación** en PDF, PPTX o DOCX. Máximo 50 MB.
- **Un navegador de escritorio.** Chrome o Edge para el modo voz.
- **Micrófono**, solo si vas a usar voz. Sin micrófono también funciona.
- **Opcional pero recomendado**: la rúbrica con la que te van a evaluar.

Un detalle que decide si esto sirve o no: **el PDF tiene que tener texto
seleccionable**. Si es un escaneo o una foto de diapositivas, no hay nada que
leer y la app te lo va a decir. Si puedes seleccionar el texto con el mouse en
tu visor de PDF, estás bien.

---

## El recorrido, pantalla por pantalla

### 1. Entrar

Abres la app y ves un CTA: **Nueva presentación**.

Si es tu primera vez te pide crear cuenta (correo y contraseña, o Google).
Es rápido y hace falta: tus sesiones quedan guardadas y solo tú las ves.

### 2. Configurar la simulación

Tres decisiones, todas con un valor por defecto razonable:

| Campo | Qué cambia |
|---|---|
| **Escenario** | Quién te va a interrogar y qué le importa |
| **Duración** | 3, 5 o 10 minutos. El cronómetro se pone rojo al pasarse |
| **Objetivo** | Qué quieres lograr. Una línea |

Los tres jurados:

- **Pitch de hackathon** → *Alex Ruiz*, product manager senior. Pregunta si el
  producto es real o un mockup disfrazado, y si los números tienen sustento.
- **Defensa de tesis** → *Dra. María Carrasco*, profesora titular. Va por la
  metodología, el tamaño de muestra y la validez de las conclusiones.
- **Pitch a inversionistas** → *Carlos Berenstein*, partner de un fondo.
  Le importa el modelo de negocio, el mercado y por qué tú y no otro.

### 3. Subir tu presentación

Arrastras el archivo o lo eliges. Se extrae el texto y arranca el análisis.

**La rúbrica (opcional, pero es lo que más mejora el resultado).**

Debajo del área de subida hay un espacio para adjuntar el criterio con el que
te van a calificar: las bases del hackathon, la rúbrica del profesor, los
criterios del comité. **Sirve una foto de la pizarra** — la leemos con visión.

Sin rúbrica, la app evalúa con criterios generales. Con rúbrica, evalúa contra
*tus* criterios y te dice cuál estás incumpliendo. Es la diferencia entre
"falta evidencia" y "esto no cumple el criterio de viabilidad técnica, que
vale 25%".

Formatos de rúbrica: PDF, DOCX, PNG, JPG.

> Si la rúbrica falla, el análisis sigue igual y te avisa. Nunca bloquea.

### 4. Esperar el Red Team

Tarda **10 a 30 segundos**. La pantalla te dice qué está haciendo. Cuando
termina, avanza sola.

### 5. Leer lo que te van a atacar

Aquí está el valor real de la app. Cuatro bloques:

**El Readiness Score (0-100).** Qué tan preparada está tu presentación para
sobrevivir a una audiencia crítica. Espera un número incómodo: el sistema está
diseñado para ser duro, no para felicitarte. Bajo 50 se muestra en rojo,
50-75 en ámbar, sobre 75 en verde.

**Cuatro subscores**: argumentación, evidencia, narrativa y defendibilidad.
El más bajo te dice por dónde empezar a arreglar.

**Las debilidades**, cada una con:
- Una etiqueta de severidad: `CRÍTICO`, `WARNING` o `INFO`
- **La página o slide exacta** donde está
- **La cita textual** de lo que dijiste, entre comillas
- Por qué es un problema

Los tipos que detecta: claim sin evidencia, contradicción, término sin
definir, hueco de narrativa, argumento débil, falta de evidencia, y unicidad
falsa (decir "somos únicos" cuando existen competidores).

**Las preguntas más probables**, con su porcentaje y quién las haría. Esto es
lo que el jurado va a usar. Si te preparas para estas tres, ya ganaste algo
aunque nunca hagas la simulación.

### 6. La simulación

Botón **Empezar simulación**. Aquí eliges cómo:

| Modo | Cuándo usarlo |
|---|---|
| **VOZ** | El ensayo real. Hablas, el jurado te contesta con voz. |
| **TEXTO** | Para probar, o si no tienes micrófono. No consume créditos de voz. |

El switch está arriba a la derecha y solo aparece antes de empezar.

**En modo voz**, antes de conectar aparece una **prueba de micrófono**: el
navegador pide permiso y te muestra un medidor. Di algo corto — "hola, uno,
dos, tres" — y cuando el medidor se mueva, el botón para empezar se habilita.

Esa prueba existe porque un micrófono silenciado o un permiso denegado antes
se descubrían recién con la simulación empezada, que es el peor momento.

Si algo falla a mitad, aparece un aviso que te lleva **directo al modo texto**
sin perder la sesión: mismo jurado, mismo Red Team report, mismo Chaos Event.

**En modo texto**, escribes lo que dirías. Mismo jurado, mismas preguntas,
mismo análisis.

Lo que ves en pantalla:

- **El cronómetro**, arriba. Se pone rojo al pasar tu duración objetivo.
- **La transcripción**, a la izquierda, en vivo.
- **El jurado**, a la derecha, con su estado:

| Estado | Qué significa |
|---|---|
| `EN ESPERA` | Todavía no arrancas |
| `ESCUCHANDO` (verde) | Te está escuchando |
| `PENSANDO` (ámbar) | Procesando lo que dijiste |
| `HABLANDO` (rojo) | Te está preguntando |

El jurado no espera a que termines para armar sus preguntas: ya leyó el Red
Team report antes de que abrieras la boca.

### 7. El Chaos Event

**Esto es lo que más sorprende, así que léelo antes de que te pase.**

A mitad de la simulación, después del tercer turno del jurado, **la pantalla
se pone roja completa**. Es a propósito.

El mensaje anuncia que **un competidor real acaba de lanzar exactamente lo que
estás vendiendo**. No es un competidor inventado: se busca en la web en el
momento, según tu pitch.

Tienes **30 segundos**, con el reloj en pantalla, para explicar por qué sigues
siendo distinto.

Se ve así:

```
🔥 CHAOS EVENT · COMPETITOR ATTACK

    ¡Presentations AI lanza una herramienta similar a la tuya!

    Acaban de presentar una función que analiza y fortalece
    pitch decks automáticamente. Diferénciate técnicamente
    en 30 segundos.

                        00:30

            DESTACA TU SIMULACIÓN ADVERSARIAL ÚNICA
```

**Qué hacer**: seguir hablando. No te congeles, no pidas tiempo. Di por qué tu
enfoque es distinto, aunque no sea perfecto. Eso es exactamente lo que estás
entrenando: en una presentación real nadie te avisa antes de la pregunta
incómoda.

Cuando pasan los 30 segundos el overlay se cierra solo y el Q&A sigue. Lo que
dijiste queda guardado y se evalúa en el reporte final.

### 8. El After Action Report

Botón **Terminar y generar reporte**. Tarda unos segundos.

Contiene:

- **Score global** con siete subscores: contenido, argumentación, evidencia,
  comunicación, manejo del tiempo, manejo del Q&A y respuesta al chaos.
- **Línea de tiempo** de la sesión, con un punto por momento. El color dice
  qué tan bien salió: verde bien, ámbar atención, rojo crítico.
- **Lo que funcionó** y **lo que falló**.
- **Recomendaciones** ordenadas por prioridad. Concretas, no "mejora tu
  comunicación".

Desde ahí puedes practicar de nuevo. Cada intento es una sesión aparte.

---

## Cómo sacarle provecho de verdad

**Haz la primera pasada en modo texto.** Te enteras de las preguntas sin
gastar créditos de voz y sin la presión del reloj.

**Responde mal a propósito una vez.** Di "hicimos algunas pruebas y vimos una
mejora considerable" y mira cómo el jurado insiste pidiendo números. Ahí se
entiende para qué sirve la app.

**Sube la rúbrica.** Es la diferencia entre un análisis genérico y uno que
habla de los criterios con los que efectivamente te van a puntuar.

**No arregles todo.** Empieza por los `CRÍTICO`. Un claim sin evidencia en la
slide 4 hunde más que tres detalles de forma.

**Practica el Chaos Event.** Improvisar 30 segundos bajo presión se entrena
igual que todo lo demás.

---

## Cuando algo falla

| Lo que ves | Qué pasa |
|---|---|
| *"El archivo no tiene texto legible"* | Es un PDF escaneado o de imágenes. Expórtalo con texto seleccionable. |
| *"Formato no soportado"* | Solo PDF, PPTX, PPT, DOCX, DOC y ODP. Si es Google Slides, descárgalo como PDF. |
| *"El archivo supera los 20 MB"* | Comprímelo o quita las imágenes pesadas. |
| *"El análisis no pudo completarse"* | Reintenta. Si sigue, el archivo puede tener una estructura rara: exporta a PDF y sube eso. |
| *"El sistema de voz falló"* | Falta micrófono, se negó el permiso, o se acabaron los créditos de voz. **Cambia a modo texto**: el jurado es el mismo. |
| *"No se reconoció una rúbrica en la imagen"* | La foto está muy borrosa o torcida. Sácala más de frente, o sube el documento. |
| El jurado tarda en responder | Normal. Entre 2 y 6 segundos: tiene que entenderte, pensar y hablar. |
| Analizando por más de un minuto | Recarga la página. El estado se guarda y no pierdes la sesión. |

**Sobre los créditos de voz.** El modo voz consume transcripción, modelo y
síntesis por cada minuto. Es lo que se agota primero. El **modo texto no
consume nada de eso** y da exactamente el mismo análisis — por eso existe.

---

## Preguntas frecuentes

**¿Qué pasa con mi presentación?**
Se guarda en tu cuenta para generar el reporte. Solo tú la ves.

**¿Puedo repetir con el mismo archivo?**
Sí. Cada sesión es independiente y lo vuelves a subir.

**¿El jurado es siempre igual?**
El personaje sí, las preguntas no. Salen de *tu* contenido y de lo que
respondes. Dos sesiones con el mismo deck no dan la misma conversación.

**¿Puedo usarlo en el celular?**
La app se ve bien en móvil, pero el modo voz necesita micrófono y una conexión
estable. Para el ensayo real, computadora.

**¿Por qué el score me da tan bajo?**
Porque está calibrado para ser duro. Un pitch normal ronda 55-70. Si te da 90,
sospecha del análisis antes que celebrar.

**¿Los competidores del Chaos Event son reales?**
Sí, se buscan en la web en el momento. Si la búsqueda falla, se usa uno
conocido del rubro para que la simulación no se corte.
