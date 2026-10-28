import { z } from "zod";

export const catalogSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});

export type CatalogSearchInput = z.infer<typeof catalogSearchSchema>;

export const bookIdSchema = z.string().trim().uuid();

export type BookIdInput = z.infer<typeof bookIdSchema>;
