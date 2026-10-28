import "server-only";

import { type DbClient, db } from "@/repositories/db";

export interface DomainFine {
  id: string;
  loanId: string;
  daysLate: number;
  dailyRateEgp: number;
  amountEgp: number;
  createdAt: Date;
  paidAt: Date | null;
  receivedById: string | null;
}

export interface UnpaidFineWithDetails extends DomainFine {
  loan: {
    id: string;
    borrowedAt: Date;
    dueDate: Date;
    returnedAt: Date | null;
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
  };
}

export async function hasUnpaidFinesByMember(
  memberId: string,
  tx: DbClient = db,
): Promise<boolean> {
  const unpaidFine = await tx.fine.findFirst({
    where: {
      paidAt: null,
      loan: {
        memberId,
      },
    },
    select: { id: true },
  });

  return unpaidFine !== null;
}

export async function sumUnpaidFinesByMember(
  memberId: string,
  tx: DbClient = db,
): Promise<number> {
  const aggregate = await tx.fine.aggregate({
    where: {
      paidAt: null,
      loan: {
        memberId,
      },
    },
    _sum: {
      amountEgp: true,
    },
  });

  return aggregate._sum.amountEgp ?? 0;
}

export async function createFine(
  data: {
    loanId: string;
    daysLate: number;
    dailyRateEgp: number;
    amountEgp: number;
  },
  tx: DbClient = db,
): Promise<DomainFine> {
  return tx.fine.create({
    data: {
      loanId: data.loanId,
      daysLate: data.daysLate,
      dailyRateEgp: data.dailyRateEgp,
      amountEgp: data.amountEgp,
    },
    select: {
      id: true,
      loanId: true,
      daysLate: true,
      dailyRateEgp: true,
      amountEgp: true,
      createdAt: true,
      paidAt: true,
      receivedById: true,
    },
  });
}

export async function findFineById(
  fineId: string,
  tx: DbClient = db,
): Promise<DomainFine | null> {
  return tx.fine.findUnique({
    where: { id: fineId },
    select: {
      id: true,
      loanId: true,
      daysLate: true,
      dailyRateEgp: true,
      amountEgp: true,
      createdAt: true,
      paidAt: true,
      receivedById: true,
    },
  });
}

export async function markFinePaid(
  params: {
    fineId: string;
    paidAt: Date;
    receivedById: string;
  },
  tx: DbClient = db,
): Promise<boolean> {
  const result = await tx.fine.updateMany({
    where: {
      id: params.fineId,
      paidAt: null,
    },
    data: {
      paidAt: params.paidAt,
      receivedById: params.receivedById,
    },
  });

  return result.count === 1;
}

export async function findUnpaidFines(
  tx: DbClient = db,
): Promise<UnpaidFineWithDetails[]> {
  const rows = await tx.fine.findMany({
    where: { paidAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      loanId: true,
      daysLate: true,
      dailyRateEgp: true,
      amountEgp: true,
      createdAt: true,
      paidAt: true,
      receivedById: true,
      loan: {
        select: {
          id: true,
          borrowedAt: true,
          dueDate: true,
          returnedAt: true,
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
      },
    },
  });

  return rows;
}
