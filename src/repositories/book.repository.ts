import "server-only";

import { type DbClient, db } from "@/repositories/db";

export interface BookWithCopyCounts {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  totalCopies: number;
  availableCopies: number;
}

function mapBookWithCopyCounts(row: {
  id: string;
  title: string;
  author: string;
  description: string;
  isbn: string | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  copies: Array<{
    id: string;
    loans: Array<{ id: string }>;
  }>;
}): BookWithCopyCounts {
  const totalCopies = row.copies.length;
  const availableCopies = row.copies.filter(
    (copy) => copy.loans.length === 0,
  ).length;

  return {
    id: row.id,
    title: row.title,
    author: row.author,
    description: row.description,
    isbn: row.isbn,
    coverImageUrl: row.coverImageUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    totalCopies,
    availableCopies,
  };
}

export async function findCatalogBooks(
  params: { query?: string } = {},
  tx: DbClient = db,
): Promise<BookWithCopyCounts[]> {
  const trimmedQuery = params.query?.trim();

  const rows = await tx.book.findMany({
    where: trimmedQuery
      ? {
          OR: [
            { title: { contains: trimmedQuery, mode: "insensitive" } },
            { author: { contains: trimmedQuery, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ createdAt: "asc" }, { title: "asc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      isbn: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
      copies: {
        where: { withdrawnAt: null },
        select: {
          id: true,
          loans: {
            where: { returnedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });

  return rows.map(mapBookWithCopyCounts);
}

export async function findBookByIdWithAvailability(
  bookId: string,
  tx: DbClient = db,
): Promise<BookWithCopyCounts | null> {
  const row = await tx.book.findUnique({
    where: { id: bookId },
    select: {
      id: true,
      title: true,
      author: true,
      description: true,
      isbn: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
      copies: {
        where: { withdrawnAt: null },
        select: {
          id: true,
          loans: {
            where: { returnedAt: null },
            select: { id: true },
          },
        },
      },
    },
  });

  return row ? mapBookWithCopyCounts(row) : null;
}
