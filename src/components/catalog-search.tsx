import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface CatalogSearchProps {
  defaultQuery?: string;
  className?: string;
}

export function CatalogSearch({
  defaultQuery = "",
  className,
}: CatalogSearchProps) {
  const tCatalog = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const hasQuery = defaultQuery.trim().length > 0;

  return (
    <form
      method="GET"
      role="search"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center",
        className,
      )}
    >
      <div className="relative flex-1">
        <Input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder={tCatalog("searchPlaceholder")}
          aria-label={tCatalog("searchPlaceholder")}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="default" className="w-full sm:w-auto">
          <Search className="size-4" strokeWidth={2.5} aria-hidden="true" />
          <span>{tCatalog("searchButton")}</span>
        </Button>

        {hasQuery ? (
          <Button
            asChild
            variant="secondary"
            className="w-full sm:w-auto shrink-0"
          >
            <Link href="/books">
              <X className="size-4" strokeWidth={2.5} aria-hidden="true" />
              <span>{tCommon("clear")}</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}
