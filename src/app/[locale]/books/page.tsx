import { SearchX } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { logoutAction } from "@/actions/auth.actions";
import { requireAuthenticatedPageUser } from "@/actions/auth.queries";
import { getCatalogBooksQuery } from "@/actions/book.queries";
import { AppHeader } from "@/components/app-header";
import { BookGrid } from "@/components/book-grid";
import { CatalogSearch } from "@/components/catalog-search";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function BooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const resolvedSearchParams = await searchParams;
  const rawQuery = Array.isArray(resolvedSearchParams.q)
    ? resolvedSearchParams.q[0]
    : resolvedSearchParams.q;
  const callbackPath = rawQuery
    ? `/${activeLocale}/books?q=${encodeURIComponent(rawQuery)}`
    : `/${activeLocale}/books`;

  const user = await requireAuthenticatedPageUser(callbackPath);
  const { books, query } = await getCatalogBooksQuery(resolvedSearchParams);

  const tCatalog = await getTranslations("catalog");
  const tCommon = await getTranslations("common");

  async function handleLogout() {
    "use server";
    await logoutAction();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <AppHeader user={user} onLogout={handleLogout} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        <PageHeader
          title={tCatalog("title")}
          subtitle={tCatalog("subtitle")}
        />

        <CatalogSearch defaultQuery={query ?? ""} />

        {books.length > 0 ? (
          <BookGrid books={books} />
        ) : (
          <EmptyState
            icon={SearchX}
            title={tCatalog("emptyTitle")}
            description={tCatalog("emptyDescription")}
            action={
              query ? (
                <Button asChild variant="secondary">
                  <Link href="/books">{tCommon("clear")}</Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
