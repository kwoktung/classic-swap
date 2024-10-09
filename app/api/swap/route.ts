import { isAddress } from "viem";
import { z } from "zod";

import { validateRequestParams } from "@/lib/validate";

import { createClient, createLiquidityClient } from "../shared";

const schema = z.object({
  src: z.string().refine((val) => isAddress(val)),
  dst: z.string().refine((val) => isAddress(val)),
  amount: z.coerce.string(),
  to: z.string().refine((val) => isAddress(val)),
});

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { src, dst, amount, to } = data;
  const client = createClient();
  const liquidityClient = createLiquidityClient({ client });
  const result = await liquidityClient.swap({
    src,
    dst,
    amount,
    to,
    slippage: 1,
  });
  return result;
};

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const validation = validateRequestParams(schema, search);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  try {
    const resp = await handleRequest(validation.data);
    return Response.json(resp);
  } catch (e) {
    return Response.json({ message: (e as Error).message }, { status: 500 });
  }
}
