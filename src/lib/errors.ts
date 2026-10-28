export const DOMAIN_ERROR_CODES = [
  // Auth & roles (P001, P002, P003)
  "UNAUTHORIZED",
  "FORBIDDEN",
  "EMAIL_ALREADY_IN_USE",
  "INVALID_CREDENTIALS",

  // Catalog & borrowing (P004, P005, P006, P010)
  "BOOK_NOT_FOUND",
  "BOOK_UNAVAILABLE",
  "LOAN_LIMIT_REACHED",
  "ALREADY_BORROWED_BOOK",
  "HAS_OVERDUE_LOANS",
  "HAS_UNPAID_FINES",

  // Returns & fines (P008, P009, P010)
  "LOAN_NOT_FOUND",
  "LOAN_ALREADY_RETURNED",
  "FINE_NOT_FOUND",
  "FINE_ALREADY_PAID",

  // Input validation (T005)
  "VALIDATION_ERROR",
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export class DomainError extends Error {
  public readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message?: string) {
    super(message ?? code);
    this.name = "DomainError";
    this.code = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export type FieldErrors = Record<string, string[]>;

export type ActionSuccess<T = void> = {
  ok: true;
  data: T;
};

export type ActionFailure = {
  ok: false;
  error: DomainErrorCode;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;
