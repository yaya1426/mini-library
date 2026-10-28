import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getCurrentUserQuery } from "@/actions/auth.queries";
import { AppHeader } from "@/components/app-header";
import { SignUpForm } from "@/components/sign-up-form";
import { routing } from "@/i18n/routing";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  setRequestLocale(activeLocale);

  const user = await getCurrentUserQuery();
  if (user) {
    redirect(`/${activeLocale}/books`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-black">
      <AppHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-12 flex items-center justify-center">
        <SignUpForm />
      </main>
    </div>
  );
}
