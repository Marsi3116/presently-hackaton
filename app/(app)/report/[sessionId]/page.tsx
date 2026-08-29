import { SectionHeader } from "@/components/section-header";
import { ReportView } from "./report-view";
import type { Id } from "@/convex/_generated/dataModel";

export default async function ReportPage({
  params,
}: PageProps<"/report/[sessionId]">) {
  const { sessionId } = await params;
  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-6 sm:py-16 md:px-10">
      <SectionHeader
        sec="SEC 05 · AFTER ACTION REPORT"
        title="Qué pasó realmente"
        hint="El post-mortem completo: cada momento crítico, qué resolviste y qué te dejaron abierto."
      />
      <ReportView sessionId={sessionId as Id<"sessions">} />
    </main>
  );
}
