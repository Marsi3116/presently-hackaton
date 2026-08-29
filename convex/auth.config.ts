// Sin este archivo, ctx.auth.getUserIdentity() devuelve null siempre y sin
// error visible. El dominio es el issuer del JWT de Clerk; Convex lo usa para
// descubrir el JWKS en {domain}/.well-known/openid-configuration.
//
// CLERK_JWT_ISSUER_DOMAIN se setea en el deployment de Convex, no en .env.local:
//   npx convex env set CLERK_JWT_ISSUER_DOMAIN https://<tu-instancia>.clerk.accounts.dev
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
