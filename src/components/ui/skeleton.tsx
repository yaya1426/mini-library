import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-stripes border-2 border-black", className)}
      {...props}
    />
  );
}

export { Skeleton };
