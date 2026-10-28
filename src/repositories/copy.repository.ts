import "server-only";

import { type DbClient, db } from "@/repositories/db";

export interface DomainCopy {
  id: string;
  bookId: string;
  barcode: string;
  withdrawnAt: Date | null;
  createdAt: Date;
}

export async function countCopyAvailabilityForBook(
  bookId: string,
  tx: DbClient = db,
): Promise<{ totalCopies: number; availableCopies: number }> {
  const [totalCopies, availableCopies] = await Promise.all([
    tx.copy.count({
      where: {
        bookId,
        withdrawnAt: null,
      },
    }),
    tx.copy.count({
      where: {
        bookId,
        withdrawnAt: null,
        loans: {
          none: {
            returnedAt: null,
          },
        },
      },
    }),
  ]);

  return { totalCopies, availableCopies };
}

export async function findCopiesByBookId(
  bookId: string,
  tx: DbClient = db,
): Promise<DomainCopy[]> {
  const copies = await tx.copy.findMany({
    where: { bookId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      bookId: true,
      barcode: true,
      withdrawnAt: true,
      createdAt: true,
    },
  });

  return copies.map((copy) => ({
    id: copy.id,
    bookId: copy.bookId,
    barcode: copy.barcode,
    withdrawnAt: copy.withdrawnAt,
    createdAt: copy.createdAt,
  }));
}

/**
 * Finds the first available non-withdrawn physical copy for `bookId`
 * (`withdrawn_at IS NULL` and no loan with `returned_at IS NULL`),
 * ordered deterministically by `createdAt ASC, id ASC` (P005).
 */
export async function findFirstAvailableCopy(
  bookId: string,
  tx: DbClient = db,
  excludeCopyIds: string[] = [],
): Promise<DomainCopy | null> {
  const copy = await tx.copy.findFirst({
    where: {
      bookId,
      withdrawnAt: null,
      ...(excludeCopyIds.length > 0 ? { id: { notIn: excludeCopyIds } } : {}),
      loans: {
        none: {
          returnedAt: null,
        },
      },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      bookId: true,
      barcode: true,
      withdrawnAt: true,
      createdAt: true,
    },
  });

  if (!copy) {
    return null;
  }

  return {
    id: copy.id,
    bookId: copy.bookId,
    barcode: copy.barcode,
    withdrawnAt: copy.withdrawnAt,
    createdAt: copy.createdAt,
  };
}

