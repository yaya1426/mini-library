"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { borrowBookAction } from "@/actions/loan.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatShortDate } from "@/i18n/format";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { calculateDueDate } from "@/lib/dates";
import type { DomainErrorCode } from "@/lib/errors";
import type { DomainLoan } from "@/repositories/loan.repository";

export interface BorrowPanelProps {
  bookId: string;
  bookTitle?: string;
  availableCopies: number;
  canBorrow?: boolean;
  blockedReason?: DomainErrorCode | null;
  dueDatePreview?: Date | string;
}

export function BorrowPanel({
  bookId,
  bookTitle,
  availableCopies,
  canBorrow,
  blockedReason,
  dueDatePreview,
}: BorrowPanelProps) {
  const tCatalog = useTranslations("catalog");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<DomainErrorCode | null>(null);
  const [confirmedLoan, setConfirmedLoan] = useState<DomainLoan | null>(null);
  const [isPending, startTransition] = useTransition();

  const isAvailable = availableCopies > 0;
  const effectiveBlockedReason: DomainErrorCode | null =
    blockedReason ?? (!isAvailable ? "BOOK_UNAVAILABLE" : null);
  const isAllowed =
    canBorrow !== undefined
      ? canBorrow && isAvailable && !effectiveBlockedReason
      : isAvailable && !effectiveBlockedReason;

  const previewDate = dueDatePreview ?? calculateDueDate(new Date());
  const formattedDueDate = formatShortDate(previewDate, locale);

  function handleOpenChange(open: boolean) {
    if (isPending) {
      return;
    }
    setIsDialogOpen(open);
    if (open) {
      setActionError(null);
    }
  }

  function handleConfirmBorrow() {
    setActionError(null);
    startTransition(async () => {
      const result = await borrowBookAction({ bookId });
      if (result.ok) {
        setConfirmedLoan(result.data);
        setIsDialogOpen(false);
      } else {
        setActionError(result.error);
      }
    });
  }

  if (confirmedLoan) {
    const confirmedDueDateFormatted = formatShortDate(
      confirmedLoan.dueDate,
      locale,
    );

    return (
      <div className="flex flex-col gap-4">
        <Alert className="border-solid bg-gray-50">
          <CheckCircle2 className="size-5" strokeWidth={2.5} />
          <div className="flex flex-col gap-2 w-full">
            <AlertTitle>{tCatalog("borrowSuccessTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                {tCatalog("borrowSuccessDescription", {
                  dueDate: confirmedDueDateFormatted,
                })}
              </span>
              <div className="pt-1">
                <Button asChild size="sm">
                  <Link href="/loans">
                    <span>{tCatalog("viewMyLoansAction")}</span>
                    <ArrowRight
                      className="size-4 rtl:-scale-x-100"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  if (!isAllowed && effectiveBlockedReason) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-5" strokeWidth={2.5} />
        <div className="flex flex-col gap-1">
          <AlertTitle>
            {effectiveBlockedReason === "BOOK_UNAVAILABLE"
              ? tCatalog("unavailable")
              : tCatalog("borrowBlockedTitle")}
          </AlertTitle>
          <AlertDescription>{tErrors(effectiveBlockedReason)}</AlertDescription>
        </div>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-gray-50 border-3 border-black shadow-sm">
      {actionError && !isDialogOpen ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-5" strokeWidth={2.5} />
          <div className="flex flex-col gap-1">
            <AlertTitle>{tCatalog("borrowBlockedTitle")}</AlertTitle>
            <AlertDescription>{tErrors(actionError)}</AlertDescription>
          </div>
        </Alert>
      ) : null}

      <div className="flex items-center gap-2 text-sm font-mono font-bold text-black">
        <Calendar className="size-4 shrink-0" strokeWidth={2.5} />
        <span>
          {tCatalog("dueDatePreview", { dueDate: formattedDueDate })}
        </span>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => handleOpenChange(true)}
        >
          <BookOpen className="size-5" strokeWidth={2.5} aria-hidden="true" />
          <span>{tCatalog("borrowButton")}</span>
        </Button>

        <DialogContent closeLabel={tCommon("cancel")}>
          <DialogHeader>
            <DialogTitle>{tCatalog("borrowConfirmTitle")}</DialogTitle>
            <DialogDescription>
              {tCatalog("borrowConfirmDescription", {
                dueDate: formattedDueDate,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 p-6 text-start">
            {actionError ? (
              <Alert variant="destructive">
                <AlertTriangle className="size-5" strokeWidth={2.5} />
                <div className="flex flex-col gap-1">
                  <AlertTitle>{tCatalog("borrowBlockedTitle")}</AlertTitle>
                  <AlertDescription>{tErrors(actionError)}</AlertDescription>
                </div>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-3 p-4 bg-gray-50 border-3 border-black">
              {bookTitle ? (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                    {tCatalog("borrowDialogBookLabel")}
                  </span>
                  <span className="text-base font-bold text-black">
                    <bdi>{bookTitle}</bdi>
                  </span>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                    {tCatalog("borrowDialogPeriodLabel")}
                  </span>
                  <span className="text-sm font-mono font-bold text-black">
                    {tCatalog("borrowDialogPeriodValue")}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-gray-600 ltr:uppercase ltr:tracking-wider">
                    {tCatalog("borrowDialogDueDateLabel")}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-mono font-bold text-black">
                    <Calendar className="size-4 shrink-0" strokeWidth={2.5} />
                    <span>{formattedDueDate}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              <span>{tCommon("cancel")}</span>
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={isPending}
              onClick={handleConfirmBorrow}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
                  <span>{tCommon("loading")}</span>
                </>
              ) : (
                <span>{tCommon("confirm")}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
