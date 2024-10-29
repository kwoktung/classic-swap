import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

import { serverConfig } from "@/config/server";

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

export async function handleApiRequest<R, T extends z.ZodType>({
  schema,
  request,
  handler,
  validateBody = false,
}: {
  schema: T;
  request: Request;
  handler: (data: z.infer<T>) => Promise<R>;
  validateBody?: boolean;
}) {
  const validation = await validateRequest(schema, request, validateBody);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  try {
    const resp = await handler(validation.data);
    return Response.json(resp);
  } catch (e) {
    const err = e as Error;
    const resp: { message: string; stack?: string } = { message: err.message };
    if (serverConfig.isDev) {
      resp.stack = err.stack;
    }
    return Response.json(resp, { status: 500 });
  }
}
