import * as React from "react";

import { cn } from "@/lib/utils";

// Tokens de docs/03-design-system.md: bg propio, hairline, radius 2px y foco
// con halo carmin en vez del ring difuso de shadcn.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-[2px] border border-hairline bg-bg-input px-4 py-3 text-[15px] text-ink transition-colors outline-none",
        "placeholder:text-ink-muted",
        "focus-visible:border-ink-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-crimson/25",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-crimson",
        className
      )}
      {...props}
    />
  );
}

export { Input };
