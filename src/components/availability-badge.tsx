import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatInteger } from "@/i18n/format";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface AvailabilityBadgeProps {
  availableCopies: number;
  className?: string;
}

export function AvailabilityBadge({
  availableCopies,
  className,
}: AvailabilityBadgeProps) {
  const tCatalog = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const isAvailable = availableCopies > 0;

  if (!isAvailable) {
    return (
      <Badge variant="muted" className={cn("gap-1.5", className)}>
        <X className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        <span>{tCatalog("unavailable")}</span>
      </Badge>
    );
  }

  const formattedCount = formatInteger(availableCopies, locale);

  return (
    <Badge variant="default" className={cn("gap-1.5 font-mono", className)}>
      <Check className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
      <span>{tCatalog("availableCopies", { count: formattedCount })}</span>
    </Badge>
  );
}
