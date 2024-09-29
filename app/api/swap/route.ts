import { BigNumber } from "bignumber.js";
import { error } from "console";
import { fromPairs } from "lodash";
import type { Address } from "viem";
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

  const { src, dst, amount, to } = validate.data;
  const client = createClient();
  const uniswapV2Service = createUniswapService({ client });

  const result = await uniswapV2Service.buildTransaction({
    src,
    dst,
    amount,
    to,
    slippage: 1,
  });

  if (!result) {
    return Response.json({ error: "failed to find out route path" });
  }

  return Response.json(result);
}
