import { BigNumber } from "bignumber.js";
import { fromPairs } from "lodash";
import { isAddress } from "viem";
import { z } from "zod";

import {
  createClient,
  createTokenService,
  createUniswapService,
  createUniswapV3Service,
} from "../shared";

const schema = z.object({
  src: z.string().refine((val) => isAddress(val)),
  dst: z.string().refine((val) => isAddress(val)),
  amount: z.coerce.string(),
  to: z.string().refine((val) => isAddress(val)),
});

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { src, dst, amount, to } = data;
  const client = createClient();
  const uniswapV2Service = createUniswapService({ client });
  const result = await uniswapV2Service.buildTransaction({
    src,
    dst,
    amount,
    to,
    slippage: 1,
  });
  return result;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const validate = schema.safeParse(
    fromPairs(Array.from(searchParams.entries())),
  );

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
