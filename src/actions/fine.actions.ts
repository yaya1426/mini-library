"use server";

import { revalidatePath } from "next/cache";
import { LOCALES } from "@/i18n/routing";
import { type ActionResult, isDomainError } from "@/lib/errors";
import { requireLibrarian } from "@/lib/session";
import type { DomainFine } from "@/repositories/fine.repository";
import {
  type MarkFinePaidInput,
  markFinePaidSchema,
} from "@/schemas/fine.schema";
import * as fineService from "@/services/fine.service";

function extractFineIdInput(
  input: MarkFinePaidInput | FormData | string,
): unknown {
  if (typeof input === "string") {
    return { fineId: input };
  }
  if (input instanceof FormData) {
    return { fineId: input.get("fineId") };
  }
  return input;
}

export async function markFinePaidAction(
  input: MarkFinePaidInput | FormData | string,
): Promise<ActionResult<DomainFine>> {
  try {
    const librarian = await requireLibrarian();

    const parsed = markFinePaidSchema.safeParse(extractFineIdInput(input));
    if (!parsed.success) {
      return {
        ok: false,
        error: "VALIDATION_ERROR",
        fieldErrors: {
          fineId: parsed.error.issues.map((issue) => issue.message),
        },
      };
    }

    const settledFine = await fineService.settleFine(
      librarian,
      parsed.data.fineId,
    );

    for (const locale of LOCALES) {
      revalidatePath(`/${locale}/loans`);
      revalidatePath(`/${locale}/admin`);
    }

    return {
      ok: true,
      data: settledFine,
    };
  } catch (error) {
    if (isDomainError(error)) {
      return {
        ok: false,
        error: error.code,
      };
    }
    throw error;
  }
}
