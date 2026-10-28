import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUserQuery } from "@/actions/auth.queries";
import { AppHeader } from "@/components/app-header";
import { LoginForm } from "@/components/login-form";
import { routing } from "@/i18n/routing";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const user = await getCurrentUserQuery();
  const { callbackUrl } = await searchParams;

  if (user) {
    redirect(`/${activeLocale}/books`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-black">
      <AppHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-12 flex items-center justify-center">
        <LoginForm callbackUrl={callbackUrl} />
      </main>
    </div>
  );
}
