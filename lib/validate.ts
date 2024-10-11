import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

export const zodEVMAddress = z
  .string()
  .transform((o) => o.toLowerCase())
  .refine((val) => isAddress(val));

export function validateRequestParams<T extends z.ZodType>(
  schema: T,
  search: string,
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const validate = schema.safeParse(qs.parse(search.slice(1), { comma: true }));

  if (validate.success) {
    return { success: true, data: validate.data };
  } else {
    const issue = validate.error.issues[0];
    const message = issue
      ? `[${issue.path.join(",")}] ${issue.message}`
      : "Invalid params";
    return { success: false, error: message };
  }
}
