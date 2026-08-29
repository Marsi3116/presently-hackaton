export function SectionHeader({
  sec,
  title,
  hint,
}: {
  sec: string;
  title: string;
  hint?: string;
}) {
  return (
    <header className="border-b border-hairline pb-6">
      <p className="label-sec">&#9656; {sec}</p>
      <h1 className="display mt-3 text-3xl font-semibold text-ink md:text-4xl">
        {title}
      </h1>
      {hint !== undefined && (
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted">
          {hint}
        </p>
      )}
    </header>
  );
}
