import "server-only";

import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { type DbClient, db } from "@/repositories/db";

export interface DomainLoan {
  id: string;
  memberId: string;
  bookId: string;
  copyId: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  returnedById: string | null;
}

export interface MemberLoanRecord extends DomainLoan {
  book: {
    id: string;
    title: string;
    author: string;
    coverImageUrl: string | null;
  };
  copy: {
    id: string;
    barcode: string;
  };
  fine: {
    id: string;
    daysLate: number;
    dailyRateEgp: number;
    amountEgp: number;
    createdAt: Date;
    paidAt: Date | null;
    receivedById: string | null;
  } | null;
}

export async function countActiveLoansByMember(
  memberId: string,
  tx: DbClient = db,
): Promise<number> {
  return tx.loan.count({
    where: {
      memberId,
      returnedAt: null,
    },
  });
}

export async function hasOverdueLoanByMember(
  memberId: string,
  cairoToday: Date,
  tx: DbClient = db,
): Promise<boolean> {
  const overdueLoan = await tx.loan.findFirst({
    where: {
      memberId,
      returnedAt: null,
      dueDate: {
        lt: cairoToday,
      },
    },
    select: { id: true },
  });

  return overdueLoan !== null;
}

export async function hasActiveLoanForBook(
  memberId: string,
  bookId: string,
  tx: DbClient = db,
): Promise<boolean> {
  const existing = await tx.loan.findFirst({
    where: {
      memberId,
      bookId,
      returnedAt: null,
    },
    select: { id: true },
  });

  return existing !== null;
}

function extractConstraintTarget(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const metaTarget = error.meta?.target;
  if (Array.isArray(metaTarget)) {
    return metaTarget.join(",");
  }
  if (typeof metaTarget === "string") {
    return metaTarget;
  }
  const driverCause = JSON.stringify(error.meta ?? {});
  return `${error.message} ${driverCause}`;
}

export async function createLoan(
  data: {
    memberId: string;
    bookId: string;
    copyId: string;
    borrowedAt: Date;
    dueDate: Date;
  },
  tx: DbClient = db,
): Promise<DomainLoan> {
  try {
    const created = await tx.loan.create({
      data: {
        memberId: data.memberId,
        bookId: data.bookId,
        copyId: data.copyId,
        borrowedAt: data.borrowedAt,
        dueDate: data.dueDate,
      },
      select: {
        id: true,
        memberId: true,
        bookId: true,
        copyId: true,
        borrowedAt: true,
        dueDate: true,
        returnedAt: true,
        returnedById: true,
      },
    });

    return created;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = extractConstraintTarget(error);
      if (
        target.includes("loans_one_active_per_book_member_idx") ||
        (target.includes("member_id") && target.includes("book_id"))
      ) {
        throw new DomainError("ALREADY_BORROWED_BOOK");
      }
      throw new DomainError("BOOK_UNAVAILABLE");
    }
    throw error;
  }
}

export async function findLoansByMember(
  memberId: string,
  tx: DbClient = db,
): Promise<MemberLoanRecord[]> {
  const rows = await tx.loan.findMany({
    where: { memberId },
    orderBy: [{ returnedAt: "asc" }, { dueDate: "asc" }, { borrowedAt: "desc" }],
    select: {
      id: true,
      memberId: true,
      bookId: true,
      copyId: true,
      borrowedAt: true,
      dueDate: true,
      returnedAt: true,
      returnedById: true,
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          coverImageUrl: true,
        },
      },
      copy: {
        select: {
          id: true,
          barcode: true,
        },
      },
      fine: {
        select: {
          id: true,
          daysLate: true,
          dailyRateEgp: true,
          amountEgp: true,
          createdAt: true,
          paidAt: true,
          receivedById: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    memberId: row.memberId,
    bookId: row.bookId,
    copyId: row.copyId,
    borrowedAt: row.borrowedAt,
    dueDate: row.dueDate,
    returnedAt: row.returnedAt,
    returnedById: row.returnedById,
    book: row.book,
    copy: row.copy,
    fine: row.fine,
  }));
}

export interface LibrarianActiveLoanRecord extends DomainLoan {
  member: {
    id: string;
    fullName: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
  };
  copy: {
    id: string;
    barcode: string;
  };
}

export async function findLoanById(
  loanId: string,
  tx: DbClient = db,
): Promise<DomainLoan | null> {
  return tx.loan.findUnique({
    where: { id: loanId },
    select: {
      id: true,
      memberId: true,
      bookId: true,
      copyId: true,
      borrowedAt: true,
      dueDate: true,
      returnedAt: true,
      returnedById: true,
    },
  });
}

export async function markLoanReturned(
  params: {
    loanId: string;
    returnedAt: Date;
    returnedById: string;
  },
  tx: DbClient = db,
): Promise<boolean> {
  const result = await tx.loan.updateMany({
    where: {
      id: params.loanId,
      returnedAt: null,
    },
    data: {
      returnedAt: params.returnedAt,
      returnedById: params.returnedById,
    },
  });

  return result.count === 1;
}

export async function findAllActiveLoans(
  tx: DbClient = db,
): Promise<LibrarianActiveLoanRecord[]> {
  const rows = await tx.loan.findMany({
    where: { returnedAt: null },
    orderBy: [{ dueDate: "asc" }, { borrowedAt: "asc" }],
    select: {
      id: true,
      memberId: true,
      bookId: true,
      copyId: true,
      borrowedAt: true,
      dueDate: true,
      returnedAt: true,
      returnedById: true,
      member: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      book: {
        select: {
          id: true,
          title: true,
          author: true,
        },
      },
      copy: {
        select: {
          id: true,
          barcode: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    memberId: row.memberId,
    bookId: row.bookId,
    copyId: row.copyId,
    borrowedAt: row.borrowedAt,
    dueDate: row.dueDate,
    returnedAt: row.returnedAt,
    returnedById: row.returnedById,
    member: row.member,
    book: row.book,
    copy: row.copy,
  }));
}

