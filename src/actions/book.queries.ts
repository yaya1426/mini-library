import "server-only";

import { DomainError } from "@/lib/errors";
import { requireUser } from "@/lib/session";
import { bookIdSchema, catalogSearchSchema } from "@/schemas/catalog.schema";
import * as catalogService from "@/services/catalog.service";
import type { CatalogBookItem } from "@/services/catalog.service";

export async function getCatalogBooksQuery(searchParams?: {
  q?: string | string[];
}): Promise<{ books: CatalogBookItem[]; query?: string }> {
  await requireUser();

  const rawQ = Array.isArray(searchParams?.q)
    ? searchParams?.q[0]
    : searchParams?.q;

  const parsed = catalogSearchSchema.safeParse({
    q: typeof rawQ === "string" ? rawQ : undefined,
  });

  const query = parsed.success ? parsed.data.q : undefined;
  const books = await catalogService.listCatalogBooks({ query });

  return { books, query };
}

export async function getBookDetailsQuery(
  bookId: string,
): Promise<CatalogBookItem> {
  await requireUser();

  const parsedId = bookIdSchema.safeParse(bookId);
  if (!parsedId.success) {
    throw new DomainError("BOOK_NOT_FOUND");
  }

  return catalogService.getBookDetails(parsedId.data);
}
