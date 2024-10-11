import { z } from "zod";

import { validateRequestParams, zodEVMAddress } from "@/lib/validate";
import { APISwapResponse } from "@/types/apis";

import { createClient, createLiquidityClient } from "../shared";

const schema = z.object({
  src: zodEVMAddress,
  dst: zodEVMAddress,
  amount: z.coerce.string(),
  to: zodEVMAddress,
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
  return result as APISwapResponse;
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
