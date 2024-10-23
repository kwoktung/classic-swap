import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

export const zodEVMAddress = z
  .string()
  .transform((o) => o.toLowerCase())
  .refine((val) => isAddress(val));

async function validateRequest<T extends z.ZodType>(
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

export async function handleApiRequest<R, T extends z.ZodType>(
  schema: T,
  request: Request,
  handler: (data: z.infer<T>) => Promise<R>,
  validateBody: boolean = false,
) {
  const validation = await validateRequest(schema, request, validateBody);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  try {
    const resp = await handler(validation.data);
    return Response.json(resp);
  } catch (e) {
    return Response.json({ message: (e as Error).message }, { status: 500 });
  }
}
