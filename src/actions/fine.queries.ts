import "server-only";

import { requireLibrarian } from "@/lib/session";
import type { UnpaidFineWithDetails } from "@/repositories/fine.repository";
import * as fineService from "@/services/fine.service";

export async function getUnpaidFinesForLibrarianQuery(): Promise<
  UnpaidFineWithDetails[]
> {
  const librarian = await requireLibrarian();
  return fineService.listUnpaidFines(librarian);
}
