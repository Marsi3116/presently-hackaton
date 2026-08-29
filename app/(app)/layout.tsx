import { auth } from "@clerk/nextjs/server";

// Guard de todas las pantallas autenticadas. Cualquier ruta nueva que necesite
// sesion (/new, /upload, /red-team, /present, /report) va adentro de este
// grupo y queda protegida sin tocar nada mas.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  await auth.protect();
  return <>{children}</>;
}
