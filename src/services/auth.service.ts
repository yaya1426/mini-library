import { DomainError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createMember,
  type DomainUser,
  findUserByEmail,
} from "@/repositories/user.repository";
import type { LoginInput, SignUpInput } from "@/schemas/auth.schema";

/**
 * Registers a new library member (P001, P003).
 * Always creates an account with `role: "MEMBER"`.
 */
export async function registerMember(input: SignUpInput): Promise<DomainUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new DomainError("EMAIL_ALREADY_IN_USE");
  }

  const passwordHash = await hashPassword(input.password);

  return createMember({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
  });
}

/**
 * Authenticates a user by email and password (P002).
 * Always throws `INVALID_CREDENTIALS` on unknown email or wrong password without revealing which failed.
 */
export async function authenticateUser(input: LoginInput): Promise<DomainUser> {
  const userWithPassword = await findUserByEmail(input.email);
  if (!userWithPassword) {
    throw new DomainError("INVALID_CREDENTIALS");
  }

  const isPasswordValid = await verifyPassword(
    input.password,
    userWithPassword.passwordHash,
  );
  if (!isPasswordValid) {
    throw new DomainError("INVALID_CREDENTIALS");
  }

  return {
    id: userWithPassword.id,
    fullName: userWithPassword.fullName,
    email: userWithPassword.email,
    role: userWithPassword.role,
    createdAt: userWithPassword.createdAt,
  };
}
