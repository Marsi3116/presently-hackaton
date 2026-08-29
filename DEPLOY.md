# Deploy

Dos servicios, los dos con plan gratuito:

- **Vercel** — el frontend de Next.js y las rutas de `app/api/`
- **Convex Cloud** — base de datos, storage y las Convex functions

Convex ya tiene un deployment de desarrollo (`dev:friendly-snake-558`).
El de produccion lo crea el propio build de Vercel.

## 1. Convex: obtener la deploy key

1. https://dashboard.convex.dev/t/marsi3116/presently
2. Settings -> **Production** -> Deploy Keys -> **Generate a production deploy key**
3. Copiar. Se usa como `CONVEX_DEPLOY_KEY` en Vercel.

## 2. Vercel: importar el repo

1. https://vercel.com/new -> **Import Git Repository** -> `Marsi3116/presently-hackaton`
2. Framework: Next.js (lo detecta solo)
3. **Build Command**: cambiar a
   ```
   npm run build:vercel
   ```
   Esto corre `convex deploy --cmd "next build"`: despliega las Convex
   functions a produccion e inyecta `NEXT_PUBLIC_CONVEX_URL` de prod antes
   de compilar Next. Con el build por defecto, la app apuntaria al Convex
   de desarrollo.

## 3. Variables de entorno en Vercel

Pegar en Settings -> Environment Variables (Production y Preview).

**NO** copiar `NEXT_PUBLIC_CONVEX_URL` ni `CONVEX_DEPLOYMENT`: los inyecta
`convex deploy`.

```
CONVEX_DEPLOY_KEY                          (paso 1)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL              /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL              /sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL   /new
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL   /new
LLM_PROVIDER                               openai
OPENAI_API_KEY
OPENAI_MODEL                               gpt-4o
OPENAI_MODEL_FAST                          gpt-4o-mini
ANTHROPIC_API_KEY
ANTHROPIC_MODEL                            claude-sonnet-4-5
ANTHROPIC_MODEL_FAST                       claude-haiku-4-5
TAVILY_API_KEY
NEXT_PUBLIC_VAPI_PUBLIC_KEY
NEXT_PUBLIC_VAPI_ASSISTANT_ID_HACKATHON
NEXT_PUBLIC_VAPI_ASSISTANT_ID_THESIS
NEXT_PUBLIC_VAPI_ASSISTANT_ID_INVESTOR
NEXT_PUBLIC_APP_URL                        https://<tu-app>.vercel.app
```

## 4. Variables en el deployment de PRODUCCION de Convex

Las Convex actions corren en la nube de Convex y **no leen las env vars de
Vercel**. Hay que setearlas aparte, en el deployment de produccion:

```bash
npx convex env set --prod LLM_PROVIDER=openai
npx convex env set --prod OPENAI_API_KEY=<tu-key>
npx convex env set --prod OPENAI_MODEL=gpt-4o
npx convex env set --prod OPENAI_MODEL_FAST=gpt-4o-mini
npx convex env set --prod TAVILY_API_KEY=<tu-key>
npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN=https://thankful-katydid-8600.clerk.accounts.dev
```

Sin `CLERK_JWT_ISSUER_DOMAIN` la app queda **silenciosamente deslogueada**
del lado del backend, sin ningun error visible.

## 5. Apuntar Vapi a produccion (deja de hacer falta ngrok)

Con la URL de Vercel ya viva, los tres asistentes tienen que apuntar ahi:

```bash
node scripts/update-vapi-url.mjs https://<tu-app>.vercel.app/api/llm
```

Ese script re-manda tambien los system prompts. **Vapi reemplaza el objeto
`model` completo en vez de hacer merge**: un PATCH sin `messages` borra el
prompt del jurado en silencio.

## 6. Clerk en produccion

Las keys `pk_test_` / `sk_test_` funcionan en Vercel para demo. Para una
instancia de produccion real hay que crearla en Clerk, con su dominio, y
regenerar el JWT template `convex` (claim `aud: "convex"`).

## Deploy automatico

Al importar el repo, Vercel queda conectado a GitHub. Desde ahi:

- push a `main` -> deploy a produccion
- push a cualquier otra rama o PR -> Preview Deployment con URL propia

No hace falta GitHub Actions ni ningun workflow.

**Ojo con los previews**: cada rama recibe una URL distinta, y los asistentes
de Vapi apuntan a una URL fija. La voz solo va a funcionar en produccion,
salvo que re-apuntes los asistentes a la URL del preview.

## Costos

| Servicio | Plan | Limite |
|---|---|---|
| Vercel Hobby | gratis | uso no comercial |
| Convex | gratis | 1 GB storage, 1M funciones/mes |
| Clerk | gratis | 10.000 usuarios activos/mes |
| Tavily | gratis | 1.000 busquedas/mes |
| **OpenAI** | **pago por uso** | LLM + TTS |
| **Vapi** | **pago por minuto** | tiene creditos de prueba |

Lo unico que se agota rapido es Vapi: cada minuto de conversacion consume
STT + LLM + TTS. Por eso `/present` tiene modo texto, que usa el mismo
jurado sin gastar nada de voz.
