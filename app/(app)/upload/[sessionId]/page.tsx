import { SectionHeader } from "@/components/section-header";
import { UploadDropzone } from "./upload-dropzone";
import type { Id } from "@/convex/_generated/dataModel";

export default async function UploadPage({ params }: PageProps<"/upload/[sessionId]">) {
  const { sessionId } = await params;
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 md:px-10">
      <SectionHeader
        sec="SEC 02 · UPLOAD"
        title="Sube tu presentación"
        hint="PDF, PPTX o DOCX. Máximo 20 MB. Se extrae el texto y el red team empieza a buscar lo que no cierra."
      />
      <UploadDropzone sessionId={sessionId as Id<"sessions">} />
    </main>
  );
}
