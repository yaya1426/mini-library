"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { type AuthActionState, loginAction } from "@/actions/auth.actions";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

function translateFieldErrors(
  keys: string[] | undefined,
  translateKey: (key: string) => string,
): string | null {
  if (!keys || keys.length === 0) {
    return null;
  }
  const first = keys[0];
  const stripped = first.startsWith("auth.") ? first.slice("auth.".length) : first;
  return translateKey(stripped);
}

export interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState<
    AuthActionState,
    FormData
  >(loginAction, null);

  const emailError = translateFieldErrors(state?.fieldErrors?.email, (key) =>
    tAuth(key as never),
  );
  const passwordError = translateFieldErrors(
    state?.fieldErrors?.password,
    (key) => tAuth(key as never),
  );

  const formLevelError =
    state && !state.ok && state.error !== "VALIDATION_ERROR"
      ? tErrors(state.error)
      : null;

  return (
    <Card className="w-full max-w-md border-4 shadow-lg">
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-2xl">{tAuth("loginTitle")}</CardTitle>
        <CardDescription>{tAuth("loginSubtitle")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} noValidate className="flex flex-col gap-5">
          <input type="hidden" name="locale" value={locale} />
          {callbackUrl ? (
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
          ) : null}

          {formLevelError ? (
            <Alert variant="destructive">
              <AlertTriangle className="size-5" strokeWidth={2.5} />
              <div className="flex flex-col gap-1">
                <AlertTitle>{formLevelError}</AlertTitle>
                <AlertDescription>{formLevelError}</AlertDescription>
              </div>
            </Alert>
          ) : null}

          <FormField
            id="login-email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            label={tAuth("emailLabel")}
            placeholder={tAuth("emailPlaceholder")}
            error={emailError}
          />

          <FormField
            id="login-password"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            required
            label={tAuth("passwordLabel")}
            placeholder={tAuth("passwordPlaceholder")}
            error={passwordError}
          />

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="w-full mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="size-5 animate-spin" strokeWidth={2.5} />
                <span>{tCommon("loading")}</span>
              </>
            ) : (
              <span>{tAuth("loginAction")}</span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-between text-sm font-medium">
        <span className="text-gray-700">{tAuth("noAccountPrompt")}</span>
        <Button asChild variant="link" size="sm">
          <Link href="/signup">{tNav("signup")}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
