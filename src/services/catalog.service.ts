import { DomainError } from "@/lib/errors";
import {
  type BookWithCopyCounts,
  findBookByIdWithAvailability,
  findCatalogBooks,
} from "@/repositories/book.repository";

export interface CatalogBookItem extends BookWithCopyCounts {
  isAvailable: boolean;
}

export async function listCatalogBooks(
  params: { query?: string } = {},
): Promise<CatalogBookItem[]> {
  const books = await findCatalogBooks({ query: params.query });

  return books.map((book) => ({
    ...book,
    isAvailable: book.availableCopies > 0,
  }));
}

export async function getBookDetails(bookId: string): Promise<CatalogBookItem> {
  const book = await findBookByIdWithAvailability(bookId);
  if (!book) {
    throw new DomainError("BOOK_NOT_FOUND");
  }

  return {
    ...book,
    isAvailable: book.availableCopies > 0,
  };
}
