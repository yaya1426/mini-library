import { BookOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AvailabilityBadge } from "@/components/availability-badge";
import { BorrowPanel } from "@/components/borrow-panel";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatInteger } from "@/i18n/format";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { CatalogBookItem } from "@/services/catalog.service";
import type { BorrowEligibilityResult } from "@/services/loan.service";

export interface BookDetailsProps {
  book: CatalogBookItem;
  eligibility?: BorrowEligibilityResult;
}

export function BookDetails({ book, eligibility }: BookDetailsProps) {
  const tCatalog = useTranslations("catalog");
  const locale = useLocale() as Locale;
  const isAvailable = book.availableCopies > 0;
  const formattedTotalCopies = formatInteger(book.totalCopies, locale);

  return (
    <Card className="border-4 shadow-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12">
        <div
          className={cn(
            "md:col-span-4 aspect-square md:aspect-auto flex flex-col items-center justify-center p-8 border-b-3 md:border-b-0 md:border-e-3 border-black",
            isAvailable ? "bg-gray-50" : "bg-stripes",
          )}
        >
          {book.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.coverImageUrl}
              alt=""
              className="max-h-80 w-auto object-contain border-3 border-black bg-white shadow-sm"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="inline-flex size-24 items-center justify-center border-3 border-black bg-white text-black shadow-sm">
                <BookOpen
                  className="size-12"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </div>
              {book.isbn ? (
                <span
                  dir="ltr"
                  className="font-mono text-xs font-bold text-black bg-white px-3 py-1 border-2 border-black shadow-xs"
                >
                  {book.isbn}
                </span>
              ) : null}
            </div>
          )}
        </div>

        <div className="md:col-span-8 flex flex-col justify-between bg-white">
          <CardHeader className="gap-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <AvailabilityBadge availableCopies={book.availableCopies} />
              <span className="text-xs font-mono font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                {tCatalog("totalCopies", { count: formattedTotalCopies })}
              </span>
            </div>

            <div className="flex flex-col gap-2 text-start">
              <h1 className="text-4xl font-bold text-black ltr:tracking-tight">
                <bdi>{book.title}</bdi>
              </h1>
              <p className="text-xl font-bold text-gray-700">
                <bdi>{book.author}</bdi>
              </p>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-6 text-start">
            <div className="flex flex-col gap-2">
              <h2 className="text-xs font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                {tCatalog("descriptionLabel")}
              </h2>
              <p className="text-base font-medium text-black leading-relaxed whitespace-pre-line">
                {book.description.trim().length > 0 ? (
                  <bdi>{book.description}</bdi>
                ) : (
                  <span className="text-gray-600">
                    {tCatalog("noDescription")}
                  </span>
                )}
              </p>
            </div>

            {book.isbn ? (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                  {tCatalog("isbnLabel")}
                </span>
                <span
                  dir="ltr"
                  className="font-mono text-sm font-bold text-black w-fit"
                >
                  {book.isbn}
                </span>
              </div>
            ) : null}

            <Separator />

            <BorrowPanel
              bookId={book.id}
              bookTitle={book.title}
              availableCopies={book.availableCopies}
              canBorrow={eligibility?.canBorrow}
              blockedReason={eligibility?.reason}
              dueDatePreview={
                eligibility?.canBorrow ? eligibility.dueDatePreview : undefined
              }
            />
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
