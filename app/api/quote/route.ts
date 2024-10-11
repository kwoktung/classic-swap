import { BigNumber } from "bignumber.js";
import { isAddress } from "viem";
import { z } from "zod";

const schema = z.object({
  src: z.string().refine((val) => isAddress(val)),
  dst: z.string().refine((val) => isAddress(val)),
  amount: z.coerce.string().refine((val) => Number(val) > 0),
});

import { validateRequestParams } from "@/lib/validate";

import {
  createClient,
  createLiquidityClient,
  createTokenService,
} from "../shared";

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { src, dst, amount } = data;
  const client = createClient();
  const liquidityClient = createLiquidityClient({ client });
  const tokenService = createTokenService({ client });

  const [srcToken, dstToken] = await tokenService.getTokens({
    addresses: [src, dst],
  });

  const { dstAmount, protocols, strategyName } = await liquidityClient.quote({
    src,
    dst,
    amount,
  });

  const getPrice = (amount: string) =>
    new BigNumber(amount)
      .shiftedBy(-dstToken.decimals)
      .div(new BigNumber(amount).shiftedBy(-srcToken.decimals))
      .decimalPlaces(6)
      .toString();

  const resp = {
    price: getPrice(dstAmount),
    buyTokenAddress: dstToken.address,
    buyAmount: dstAmount,
    sellAmount: amount,
    sellTokenAddress: srcToken.address,
    protocols,
    strategyName,
  };

  return resp;
};

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const validation = validateRequestParams(schema, search);
  if (!validation.success) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  try {
    const result = await handleRequest(validation.data);
    return Response.json(result);
  } catch (e: unknown) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}
