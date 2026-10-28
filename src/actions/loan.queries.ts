import "server-only";

import { DomainError } from "@/lib/errors";
import { requireLibrarian, requireUser } from "@/lib/session";
import { borrowBookSchema } from "@/schemas/loan.schema";
import * as loanService from "@/services/loan.service";
import type {
  BorrowEligibilityResult,
  LibrarianActiveLoanItem,
  MemberLoansSummary,
} from "@/services/loan.service";

export async function getBorrowEligibilityQuery(
  bookId: string,
): Promise<BorrowEligibilityResult> {
  const user = await requireUser();

  const parsed = borrowBookSchema.safeParse({ bookId });
  if (!parsed.success) {
    throw new DomainError("BOOK_NOT_FOUND");
  }

  return loanService.getBorrowEligibility(user, parsed.data.bookId);
}

export async function getMyLoansQuery(): Promise<MemberLoansSummary> {
  const user = await requireUser();
  return loanService.getMemberLoansSummary(user);
}

export async function getActiveLoansForLibrarianQuery(): Promise<
  LibrarianActiveLoanItem[]
> {
  const librarian = await requireLibrarian();
  return loanService.listAllActiveLoans(librarian);
}
