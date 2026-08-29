import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Chips del dossier: mono, uppercase, tracking ancho, radius 2px.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-[2px] border px-2 py-[3px] font-mono text-[10px] font-medium tracking-[0.15em] uppercase whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        critical: "border-crimson bg-crimson-dim/40 text-crimson",
        warning: "border-amber bg-amber-dim/25 text-amber",
        ok: "border-teal bg-teal-dim/25 text-teal",
        neutral: "border-hairline bg-bg-input text-ink-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
