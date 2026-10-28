import { DomainError } from "@/lib/errors";
import type { SessionUser } from "@/lib/session";
import {
  type DomainFine,
  findFineById,
  findUnpaidFines,
  markFinePaid,
  type UnpaidFineWithDetails,
} from "@/repositories/fine.repository";

/**
 * Marks an unpaid fine as paid in person by a librarian (P003, P010, P010-Q1).
 */
export async function settleFine(
  actor: SessionUser,
  fineId: string,
  paidAt: Date = new Date(),
): Promise<DomainFine> {
  if (actor.role !== "LIBRARIAN") {
    throw new DomainError("FORBIDDEN");
  }

  const fine = await findFineById(fineId);
  if (!fine) {
    throw new DomainError("FINE_NOT_FOUND");
  }

  if (fine.paidAt !== null) {
    throw new DomainError("FINE_ALREADY_PAID");
  }

  const updated = await markFinePaid({
    fineId,
    paidAt,
    receivedById: actor.id,
  });

  if (!updated) {
    throw new DomainError("FINE_ALREADY_PAID");
  }

  return {
    ...fine,
    paidAt,
    receivedById: actor.id,
  };
}

/**
 * Lists all unpaid fines across members for librarian management (P003, P010).
 */
export async function listUnpaidFines(
  actor: SessionUser,
): Promise<UnpaidFineWithDetails[]> {
  if (actor.role !== "LIBRARIAN") {
    throw new DomainError("FORBIDDEN");
  }

  return findUnpaidFines();
}
