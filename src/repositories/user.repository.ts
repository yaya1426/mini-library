import "server-only";

import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors";
import { type DbClient, db } from "@/repositories/db";

export type UserRole = "MEMBER" | "LIBRARIAN";

export interface DomainUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface DomainUserWithPassword extends DomainUser {
  passwordHash: string;
}

function toDomainUser(row: {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}): DomainUser {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export async function findUserByEmail(
  email: string,
  tx: DbClient = db,
): Promise<DomainUserWithPassword | null> {
  const user = await tx.user.findUnique({
    where: { email: email.trim() },
    select: {
      id: true,
      fullName: true,
      email: true,
      passwordHash: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...toDomainUser(user),
    passwordHash: user.passwordHash,
  };
}

export async function findUserById(
  id: string,
  tx: DbClient = db,
): Promise<DomainUser | null> {
  const user = await tx.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user ? toDomainUser(user) : null;
}

export async function createMember(
  input: {
    fullName: string;
    email: string;
    passwordHash: string;
  },
  tx: DbClient = db,
): Promise<DomainUser> {
  try {
    const created = await tx.user.create({
      data: {
        fullName: input.fullName.trim(),
        email: input.email.trim(),
        passwordHash: input.passwordHash,
        role: "MEMBER",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return toDomainUser(created);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new DomainError("EMAIL_ALREADY_IN_USE");
    }
    throw error;
  }
}

export async function updateUserPassword(
  userId: string,
  passwordHash: string,
  tx: DbClient = db,
): Promise<DomainUser> {
  const updated = await tx.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return toDomainUser(updated);
}

/**
 * Acquires a row-level `FOR UPDATE` lock on the member row inside an active transaction
 * so concurrent borrow requests by the same member run sequentially (P006, database.md).
 */
export async function lockMemberForUpdate(
  memberId: string,
  tx: DbClient,
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${memberId}::uuid FOR UPDATE`;
}

