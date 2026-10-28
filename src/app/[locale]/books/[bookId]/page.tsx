import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { logoutAction } from "@/actions/auth.actions";
import { requireAuthenticatedPageUser } from "@/actions/auth.queries";
import { getBookDetailsQuery } from "@/actions/book.queries";
import { getBorrowEligibilityQuery } from "@/actions/loan.queries";
import { AppHeader } from "@/components/app-header";
import { BookDetails } from "@/components/book-details";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isDomainError } from "@/lib/errors";
import type { CatalogBookItem } from "@/services/catalog.service";
import type { BorrowEligibilityResult } from "@/services/loan.service";

export default async function BookDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; bookId: string }>;
}) {
  const { locale, bookId } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const user = await requireAuthenticatedPageUser(
    `/${activeLocale}/books/${bookId}`,
  );

  let book: CatalogBookItem;
  let eligibility: BorrowEligibilityResult;
  try {
    [book, eligibility] = await Promise.all([
      getBookDetailsQuery(bookId),
      getBorrowEligibilityQuery(bookId),
    ]);
  } catch (error) {
    if (isDomainError(error) && error.code === "BOOK_NOT_FOUND") {
      notFound();
    }
    throw error;
  }

  const tCatalog = await getTranslations("catalog");

  async function handleLogout() {
    "use server";
    await logoutAction();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <AppHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        <div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/books">
              <ArrowLeft
                className="size-4 rtl:-scale-x-100"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <span>{tCatalog("backToCatalog")}</span>
            </Link>
          </Button>
        </div>

        <BookDetails book={book} eligibility={eligibility} />
      </main>
    </div>
  );
}
