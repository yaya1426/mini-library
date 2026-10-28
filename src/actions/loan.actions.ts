"use server";

import { revalidatePath } from "next/cache";
import { LOCALES } from "@/i18n/routing";
import { type ActionResult, isDomainError } from "@/lib/errors";
import { requireLibrarian, requireUser } from "@/lib/session";
import type { DomainLoan } from "@/repositories/loan.repository";
import {
  type BorrowBookInput,
  borrowBookSchema,
  type RecordReturnInput,
  recordReturnSchema,
} from "@/schemas/loan.schema";
import * as loanService from "@/services/loan.service";
import type { RecordReturnResult } from "@/services/loan.service";

function extractBookIdInput(
  input: BorrowBookInput | FormData | string,
): unknown {
  if (typeof input === "string") {
    return { bookId: input };
  }
  if (input instanceof FormData) {
    return { bookId: input.get("bookId") };
  }
  return input;
}

function extractLoanIdInput(
  input: RecordReturnInput | FormData | string,
): unknown {
  if (typeof input === "string") {
    return { loanId: input };
  }
  if (input instanceof FormData) {
    return { loanId: input.get("loanId") };
  }
  return input;
}

export async function borrowBookAction(
  input: BorrowBookInput | FormData | string,
): Promise<ActionResult<DomainLoan>> {
  try {
    const user = await requireUser();

    const parsed = borrowBookSchema.safeParse(extractBookIdInput(input));
    if (!parsed.success) {
      return {
        ok: false,
        error: "VALIDATION_ERROR",
        fieldErrors: {
          bookId: parsed.error.issues.map((issue) => issue.message),
        },
      };
    }

    const loan = await loanService.borrowBook(user, parsed.data.bookId);

    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/books`);
      revalidatePath(`/${locale}/books/${parsed.data.bookId}`);
      revalidatePath(`/${locale}/loans`);
    }

    return {
      ok: true,
      data: loan,
    };
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        error: error.code,
      };
    }
    throw error;
  }
}

export async function recordReturnAction(
  input: RecordReturnInput | FormData | string,
): Promise<ActionResult<RecordReturnResult>> {
  try {
    const librarian = await requireLibrarian();

    const parsed = recordReturnSchema.safeParse(extractLoanIdInput(input));
    if (!parsed.success) {
      return {
        ok: false,
        error: "VALIDATION_ERROR",
        fieldErrors: {
          loanId: parsed.error.issues.map((issue) => issue.message),
        },
      };
    }

    const result = await loanService.recordReturn(
      librarian,
      parsed.data.loanId,
    );

    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/books`);
      revalidatePath(`/${locale}/books/${result.loan.bookId}`);
      revalidatePath(`/${locale}/loans`);
      revalidatePath(`/${locale}/admin`);
    }

    return {
      ok: true,
      data: result,
    };
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        error: error.code,
      };
    }
    throw error;
  }
}
