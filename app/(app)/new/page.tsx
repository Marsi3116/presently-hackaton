import { SectionHeader } from "@/components/section-header";
import { NewSessionForm } from "./new-session-form";

export default function NewSessionPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-6 sm:py-16 md:px-10">
      <SectionHeader
        sec="SEC 01 · SETUP"
        title="Configurar simulación"
        hint="Todo viene con valores por defecto. Cambia solo lo que necesites y continúa."
      />
      <NewSessionForm />
    </main>
  );
}
