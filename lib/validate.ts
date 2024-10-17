import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

export const zodEVMAddress = z
  .string()
  .transform((o) => o.toLowerCase())
  .refine((val) => isAddress(val));

export async function validateRequest<T extends z.ZodType>(
  schema: T,
  request: Request,
  isBody: boolean = false,
): Promise<
  { success: true; data: z.infer<T> } | { success: false; error: string }
> {
  const data = isBody
    ? await request.json()
    : qs.parse(new URL(request.url).search.slice(1), { comma: true });

  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return { success: true, data: parsed.data };
  } else {
    const issue = parsed.error.issues[0];
    const message = issue
      ? `[${issue.path.join(",")}] ${issue.message}`
      : "Invalid params";
    return { success: false, error: message };
  }
}
