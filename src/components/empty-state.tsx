import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-10 text-center bg-white border-3 border-dashed border-black",
        className,
      )}
    >
      <div className="inline-flex size-14 items-center justify-center border-3 border-black bg-gray-100 text-black shadow-xs">
        <Icon className="size-6" strokeWidth={2.5} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-md">
        <h2 className="text-xl font-bold text-black ltr:tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="text-sm font-medium text-gray-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
