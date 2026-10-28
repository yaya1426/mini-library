import { redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getCurrentUserQuery } from "@/actions/auth.queries";
import { routing } from "@/i18n/routing";

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;

  const user = await getCurrentUserQuery();
  if (user) {
    redirect(`/${activeLocale}/books`);
  }

  redirect(`/${activeLocale}/login`);
}
