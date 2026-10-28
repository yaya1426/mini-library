"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "inline-flex items-center gap-2 text-xs font-bold text-black select-none ltr:uppercase ltr:tracking-wider peer-disabled:cursor-not-allowed peer-disabled:text-gray-500",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
