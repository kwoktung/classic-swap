import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

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
  const uniswapV2Service = createLiquidityClient({ client });
  const result = await uniswapV2Service.swap({
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
  const validate = schema.safeParse(qs.parse(search.slice(1)));

  if (validate.error) {
    const issue = validate.error.issues[0];
    const message = issue
      ? `[${issue.path.join(",")}] ${issue.message}`
      : "Invalid params";
    return Response.json({ error: message }, { status: 401 });
  }

  try {
    const resp = await handleRequest(validate.data);
    return Response.json(resp);
  } catch (e) {
    return Response.json({ message: (e as Error).message }, { status: 500 });
  }
}
