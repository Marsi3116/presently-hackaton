import { PresentationRoom } from "./presentation-room";
import type { Id } from "@/convex/_generated/dataModel";

export default async function PresentPage({
  params,
}: PageProps<"/present/[sessionId]">) {
  const { sessionId } = await params;
  return <PresentationRoom sessionId={sessionId as Id<"sessions">} />;
}
