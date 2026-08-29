import { clerkMiddleware } from "@clerk/nextjs/server";

// Solo adjunta el contexto de auth a cada request. La autorizacion NO se hace
// aca: Clerk Core 3 deprecio createRouteMatcher porque el path matching puede
// divergir del routing de Next y dejar rutas protegidas alcanzables.
// El guard real vive en app/(app)/layout.tsx.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo menos estaticos e internals de Next
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
