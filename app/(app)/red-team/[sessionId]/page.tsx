import { SectionHeader } from "@/components/section-header";
import { RedTeamReport } from "./red-team-report";
import type { Id } from "@/convex/_generated/dataModel";

export default async function RedTeamPage({
  params,
}: PageProps<"/red-team/[sessionId]">) {
  const { sessionId } = await params;
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-16 md:px-10">
      <SectionHeader
        sec="SEC 03 · RED TEAM"
        title="Lo que te van a atacar"
        hint="Esto es lo que un analista adversarial encontró antes de que abras la boca. El jurado va a partir de acá."
      />
      <RedTeamReport sessionId={sessionId as Id<"sessions">} />
    </main>
  );
}
