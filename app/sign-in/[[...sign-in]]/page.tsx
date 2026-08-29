import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16">
      <p className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.15em] text-[#D63B32]">
        SEC 00 &middot; ACCESO
      </p>
      <SignIn />
    </main>
  );
}
