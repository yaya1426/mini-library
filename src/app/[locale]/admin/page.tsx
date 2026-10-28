import { Shield } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { logoutAction } from "@/actions/auth.actions";
import { requireLibrarianPageUser } from "@/actions/auth.queries";
import { AppHeader } from "@/components/app-header";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { routing } from "@/i18n/routing";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const user = await requireLibrarianPageUser(`/${activeLocale}/admin`);
  const tLibrarian = await getTranslations("librarian");

  async function handleLogout() {
    "use server";
    await logoutAction();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <AppHeader user={user} onLogout={handleLogout} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 flex flex-col gap-8">
        <PageHeader
          title={tLibrarian("title")}
          subtitle={tLibrarian("subtitle")}
        />
        <EmptyState
          icon={Shield}
          title={tLibrarian("title")}
          description={tLibrarian("subtitle")}
        />
      </main>
    </div>
  );
}
