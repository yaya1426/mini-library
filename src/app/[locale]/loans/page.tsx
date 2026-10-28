import { BookOpen } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { logoutAction } from "@/actions/auth.actions";
import { requireAuthenticatedPageUser } from "@/actions/auth.queries";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default async function LoansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const user = await requireAuthenticatedPageUser(`/${activeLocale}/loans`);
  const tLoans = await getTranslations("loans");

  async function handleLogout() {
    "use server";
    await logoutAction();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <AppHeader user={user} onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        <PageHeader title={tLoans("title")} subtitle={tLoans("subtitle")} />
        <EmptyState
          icon={BookOpen}
          title={tLoans("emptyTitle")}
          description={tLoans("emptyDescription")}
          action={
            <Button asChild size="lg">
              <Link href="/books">{tLoans("browseCatalogAction")}</Link>
            </Button>
          }
        />
      </main>
    </div>
  );
}
