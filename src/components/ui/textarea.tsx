import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full bg-white px-4 py-3 text-base font-medium text-black border-3 border-black shadow-xs placeholder:text-gray-500 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black disabled:bg-gray-200 disabled:text-gray-500 disabled:border-gray-300 disabled:shadow-none disabled:cursor-not-allowed aria-invalid:border-4",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
