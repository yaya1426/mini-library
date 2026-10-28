import { z } from "zod";

export const borrowBookSchema = z.object({
  bookId: z.string().trim().uuid(),
});

export type BorrowBookInput = z.infer<typeof borrowBookSchema>;

export const recordReturnSchema = z.object({
  loanId: z.string().trim().uuid(),
});

export type RecordReturnInput = z.infer<typeof recordReturnSchema>;
