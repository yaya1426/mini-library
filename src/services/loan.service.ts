import {
  calculateDaysLate,
  calculateDaysRemaining,
  calculateDueDate,
  calculateFineEgp,
  DAILY_FINE_RATE_EGP,
  getCairoToday,
} from "@/lib/dates";
import { DomainError, type DomainErrorCode, isDomainError } from "@/lib/errors";
import type { SessionUser } from "@/lib/session";
import { findBookByIdWithAvailability } from "@/repositories/book.repository";
import { findFirstAvailableCopy } from "@/repositories/copy.repository";
import { withTransaction } from "@/repositories/db";
import {
  createFine,
  type DomainFine,
  hasUnpaidFinesByMember,
  sumUnpaidFinesByMember,
} from "@/repositories/fine.repository";
import {
  countActiveLoansByMember,
  createLoan,
  type DomainLoan,
  findAllActiveLoans,
  findLoanById,
  findLoansByMember,
  hasActiveLoanForBook,
  hasOverdueLoanByMember,
  type LibrarianActiveLoanRecord,
  type MemberLoanRecord,
  markLoanReturned,
} from "@/repositories/loan.repository";
import { lockMemberForUpdate } from "@/repositories/user.repository";

export const MAX_CONCURRENT_LOANS = 3;
export const DUE_SOON_THRESHOLD_DAYS = 2;

export type BorrowBlockedReason =
  | "FORBIDDEN"
  | "ALREADY_BORROWED_BOOK"
  | "HAS_OVERDUE_LOANS"
  | "HAS_UNPAID_FINES"
  | "LOAN_LIMIT_REACHED"
  | "BOOK_UNAVAILABLE";

export type BorrowEligibilityResult =
  | {
      canBorrow: true;
      reason: null;
      dueDatePreview: Date;
    }
  | {
      canBorrow: false;
      reason: BorrowBlockedReason;
    };

export type LoanDueStatus = "ON_TIME" | "DUE_SOON" | "OVERDUE";

export interface EnrichedActiveLoan extends MemberLoanRecord {
  daysRemaining: number;
  daysLate: number;
  dueStatus: LoanDueStatus;
  runningFineEgp: number;
}

export interface MemberLoansSummary {
  activeLoansCount: number;
  maxConcurrentLoans: number;
  totalUnpaidFinesEgp: number;
  hasDueSoonOrOverdue: boolean;
  activeLoans: EnrichedActiveLoan[];
  pastLoans: MemberLoanRecord[];
}

export interface RecordReturnResult {
  loan: DomainLoan;
  fine: DomainFine | null;
}

export interface LibrarianActiveLoanItem extends LibrarianActiveLoanRecord {
  daysRemaining: number;
  daysLate: number;
  dueStatus: LoanDueStatus;
  isOverdue: boolean;
  runningFineEgp: number;
}

export function computeActiveLoanStatus(
  dueDate: Date | string,
  referenceDate: Date = new Date(),
): {
  daysRemaining: number;
  daysLate: number;
  dueStatus: LoanDueStatus;
  runningFineEgp: number;
} {
  const daysRemaining = calculateDaysRemaining(dueDate, referenceDate);
  const daysLate = calculateDaysLate(dueDate, referenceDate);

  let dueStatus: LoanDueStatus = "ON_TIME";
  if (daysLate > 0) {
    dueStatus = "OVERDUE";
  } else if (daysRemaining <= DUE_SOON_THRESHOLD_DAYS) {
    dueStatus = "DUE_SOON";
  }

  const runningFineEgp = calculateFineEgp(daysLate);

  return {
    daysRemaining,
    daysLate,
    dueStatus,
    runningFineEgp,
  };
}

/**
 * Evaluates whether `user` is currently eligible to borrow `bookId` (P003, P005, P006, P007, P010).
 */
export async function getBorrowEligibility(
  user: SessionUser,
  bookId: string,
  now: Date = new Date(),
): Promise<BorrowEligibilityResult> {
  if (user.role !== "MEMBER") {
    return { canBorrow: false, reason: "FORBIDDEN" };
  }

  const book = await findBookByIdWithAvailability(bookId);
  if (!book) {
    throw new DomainError("BOOK_NOT_FOUND");
  }

  const cairoToday = getCairoToday(now);

  // 1. Member already holds an active loan for this book (P006-Q1)
  if (await hasActiveLoanForBook(user.id, bookId)) {
    return { canBorrow: false, reason: "ALREADY_BORROWED_BOOK" };
  }

  // 2. Member has any overdue active loan (P006-Q2)
  if (await hasOverdueLoanByMember(user.id, cairoToday)) {
    return { canBorrow: false, reason: "HAS_OVERDUE_LOANS" };
  }

  // 3. Member has any unpaid fine (P010-Q2)
  if (await hasUnpaidFinesByMember(user.id)) {
    return { canBorrow: false, reason: "HAS_UNPAID_FINES" };
  }

  // 4. Member has >= 3 active loans (P006)
  const activeCount = await countActiveLoansByMember(user.id);
  if (activeCount >= MAX_CONCURRENT_LOANS) {
    return { canBorrow: false, reason: "LOAN_LIMIT_REACHED" };
  }

  // 5. Book has 0 available copies (P005)
  if (book.availableCopies <= 0) {
    return { canBorrow: false, reason: "BOOK_UNAVAILABLE" };
  }

  return {
    canBorrow: true,
    reason: null,
    dueDatePreview: calculateDueDate(now),
  };
}

/**
 * Atomically borrows an available physical copy of `bookId` for `user` inside a database transaction
 * with a `FOR UPDATE` row lock on `users` (P003, P005, P006, P007, P010, database.md).
 */
export async function borrowBook(
  user: SessionUser,
  bookId: string,
  now: Date = new Date(),
): Promise<DomainLoan> {
  if (user.role !== "MEMBER") {
    throw new DomainError("FORBIDDEN");
  }

  const maxCopyAttempts = 3;
  const triedCopyIds: string[] = [];

  for (let attempt = 0; attempt < maxCopyAttempts; attempt++) {
    try {
      return await withTransaction(async (tx) => {
        // 1. Serialize concurrent borrow requests by the same member (P006, database.md)
        await lockMemberForUpdate(user.id, tx);

        // 2. Verify book exists
        const book = await findBookByIdWithAvailability(bookId, tx);
        if (!book) {
          throw new DomainError("BOOK_NOT_FOUND");
        }

        // 3. Check duplicate active loan for this book (P006-Q1)
        if (await hasActiveLoanForBook(user.id, bookId, tx)) {
          throw new DomainError("ALREADY_BORROWED_BOOK");
        }

        // 4. Check overdue active loans in Africa/Cairo (P006-Q2)
        const cairoToday = getCairoToday(now);
        if (await hasOverdueLoanByMember(user.id, cairoToday, tx)) {
          throw new DomainError("HAS_OVERDUE_LOANS");
        }

        // 5. Check unpaid fines (P010-Q2)
        if (await hasUnpaidFinesByMember(user.id, tx)) {
          throw new DomainError("HAS_UNPAID_FINES");
        }

        // 6. Check 3-book concurrent loan limit (P006)
        const activeCount = await countActiveLoansByMember(user.id, tx);
        if (activeCount >= MAX_CONCURRENT_LOANS) {
          throw new DomainError("LOAN_LIMIT_REACHED");
        }

        // 7. Pick an available non-withdrawn physical copy (P005)
        const copy = await findFirstAvailableCopy(bookId, tx, triedCopyIds);
        if (!copy) {
          throw new DomainError("BOOK_UNAVAILABLE");
        }

        triedCopyIds.push(copy.id);

        // 8. Compute borrowedAt and 14-day dueDate in Africa/Cairo (P007)
        const borrowedAt = now;
        const dueDate = calculateDueDate(borrowedAt);

        // 9. Insert active loan
        return createLoan(
          {
            memberId: user.id,
            bookId,
            copyId: copy.id,
            borrowedAt,
            dueDate,
          },
          tx,
        );
      });
    } catch (error) {
      // If another member raced for the same copy and won, retry with another available copy
      if (
        isDomainError(error) &&
        error.code === ("BOOK_UNAVAILABLE" satisfies DomainErrorCode) &&
        triedCopyIds.length > 0 &&
        attempt < maxCopyAttempts - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new DomainError("BOOK_UNAVAILABLE");
}

/**
 * Returns the member's active and past loans along with live due status (`ON_TIME`, `DUE_SOON`, `OVERDUE`),
 * running fine in EGP (`daysLate * 5`), and total unpaid settled fines (P006, P007, P009, P010, P011).
 */
export async function getMemberLoansSummary(
  user: SessionUser,
  now: Date = new Date(),
): Promise<MemberLoansSummary> {
  const [loans, totalUnpaidFinesEgp] = await Promise.all([
    findLoansByMember(user.id),
    sumUnpaidFinesByMember(user.id),
  ]);

  const activeLoans: EnrichedActiveLoan[] = [];
  const pastLoans: MemberLoanRecord[] = [];

  for (const loan of loans) {
    if (loan.returnedAt === null) {
      const status = computeActiveLoanStatus(loan.dueDate, now);
      activeLoans.push({
        ...loan,
        ...status,
      });
    } else {
      pastLoans.push(loan);
    }
  }

  const hasDueSoonOrOverdue = activeLoans.some(
    (loan) => loan.dueStatus === "DUE_SOON" || loan.dueStatus === "OVERDUE",
  );

  return {
    activeLoansCount: activeLoans.length,
    maxConcurrentLoans: MAX_CONCURRENT_LOANS,
    totalUnpaidFinesEgp,
    hasDueSoonOrOverdue,
    activeLoans,
    pastLoans,
  };
}

/**
 * Records a physical book return by a librarian, closing the loan and atomically creating
 * a late fine of 5 EGP/day if returned after `dueDate` in `Africa/Cairo` (P003, P008, P009, database.md).
 */
export async function recordReturn(
  actor: SessionUser,
  loanId: string,
  returnedAt: Date = new Date(),
): Promise<RecordReturnResult> {
  if (actor.role !== "LIBRARIAN") {
    throw new DomainError("FORBIDDEN");
  }

  return withTransaction(async (tx) => {
    const loan = await findLoanById(loanId, tx);
    if (!loan) {
      throw new DomainError("LOAN_NOT_FOUND");
    }

    if (loan.returnedAt !== null) {
      throw new DomainError("LOAN_ALREADY_RETURNED");
    }

    const updated = await markLoanReturned(
      {
        loanId,
        returnedAt,
        returnedById: actor.id,
      },
      tx,
    );

    if (!updated) {
      throw new DomainError("LOAN_ALREADY_RETURNED");
    }

    const daysLate = calculateDaysLate(loan.dueDate, returnedAt);
    let fine: DomainFine | null = null;

    if (daysLate > 0) {
      const dailyRateEgp = DAILY_FINE_RATE_EGP;
      const amountEgp = calculateFineEgp(daysLate, dailyRateEgp);
      fine = await createFine(
        {
          loanId,
          daysLate,
          dailyRateEgp,
          amountEgp,
        },
        tx,
      );
    }

    return {
      loan: {
        ...loan,
        returnedAt,
        returnedById: actor.id,
      },
      fine,
    };
  });
}

/**
 * Lists all active loans across members for librarian inspection, enriched with
 * live `Africa/Cairo` countdown, overdue status, and running fine (P003, P008, P009, P011).
 */
export async function listAllActiveLoans(
  actor: SessionUser,
  now: Date = new Date(),
): Promise<LibrarianActiveLoanItem[]> {
  if (actor.role !== "LIBRARIAN") {
    throw new DomainError("FORBIDDEN");
  }

  const loans = await findAllActiveLoans();

  return loans.map((loan) => {
    const status = computeActiveLoanStatus(loan.dueDate, now);
    return {
      ...loan,
      ...status,
      isOverdue: status.daysLate > 0,
    };
  });
}
