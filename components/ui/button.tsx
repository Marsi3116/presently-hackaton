import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

// Customizado sobre el default de shadcn con los tokens de
// docs/03-design-system.md: radius 2px, sin sombras, sin scale en hover.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[2px] border border-transparent text-sm font-semibold tracking-[0.02em] whitespace-nowrap transition-colors duration-100 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-crimson/40 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-crimson text-ink hover:bg-crimson-dim",
        outline:
          "border-[1.5px] border-hairline-strong bg-transparent text-ink hover:border-ink-muted hover:bg-bg-elevated",
        secondary: "bg-bg-input text-ink hover:bg-hairline",
        ghost: "text-ink-soft hover:text-ink hover:underline underline-offset-4",
        destructive: "bg-crimson-dim text-ink hover:bg-crimson",
        link: "text-crimson underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 text-[13px]",
        lg: "h-12 px-8 text-[15px]",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
