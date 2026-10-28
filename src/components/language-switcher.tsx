"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Suspense } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALES, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function LanguageSwitcherInner({ className }: { className?: string }) {
  const t = useTranslations("common");
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryString = searchParams.toString();
  const hrefWithQuery = queryString ? `${pathname}?${queryString}` : pathname;

  function handleSwitch(nextLocale: Locale) {
    if (nextLocale === currentLocale) {
      return;
    }
    router.replace(hrefWithQuery, { locale: nextLocale });
  }

  return (
    <div
      role="group"
      aria-label={t("languageSwitcherLabel")}
      className={cn(
        "inline-flex items-stretch border-3 border-black bg-white shadow-xs",
        className,
      )}
    >
      {LOCALES.map((targetLocale, index) => {
        const isActive = targetLocale === currentLocale;
        const shortLabel =
          targetLocale === "ar" ? t("arabicShort") : t("englishShort");
        const fullLabel =
          targetLocale === "ar" ? t("arabicName") : t("englishName");

        return (
          <button
            key={targetLocale}
            type="button"
            onClick={() => handleSwitch(targetLocale)}
            aria-pressed={isActive}
            aria-label={fullLabel}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center px-3 text-sm font-bold cursor-pointer select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black",
              index > 0 && "border-s-3 border-black",
              targetLocale === "en" && "font-mono uppercase tracking-wider",
              isActive
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-gray-100",
            )}
          >
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageSwitcher({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "inline-flex h-[46px] w-[92px] border-3 border-black bg-white shadow-xs",
            className,
          )}
        />
      }
    >
      <LanguageSwitcherInner className={className} />
    </Suspense>
  );
}
