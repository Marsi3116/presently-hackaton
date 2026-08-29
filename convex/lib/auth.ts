import type { Auth } from "convex/server";

/**
 * Identidad del usuario logueado.
 *
 * Usamos tokenIdentifier y no subject: subject solo es unico dentro de un
 * issuer, mientras que tokenIdentifier ya combina issuer + subject. Es lo que
 * recomienda Convex para cualquier lookup ligado a auth.
 */
export async function requireUserId(auth: Auth): Promise<string> {
  const identity = await auth.getUserIdentity();
  if (identity === null) {
    throw new Error("No autenticado.");
  }
  return identity.tokenIdentifier;
}
