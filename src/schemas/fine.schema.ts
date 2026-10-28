import { z } from "zod";

export const markFinePaidSchema = z.object({
  fineId: z.string().trim().uuid(),
});

export type MarkFinePaidInput = z.infer<typeof markFinePaidSchema>;
