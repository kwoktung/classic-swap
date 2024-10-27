import { BigNumber } from "bignumber.js";
import { z } from "zod";

import { handleApiRequest, zodEVMAddress } from "@/lib/validate";
import { APIQuoteResponse } from "@/types/apis";

const schema = z.object({
  src: zodEVMAddress,
  dst: zodEVMAddress,
  amount: z.coerce.string().refine((val) => Number(val) > 0),
});

import { factory } from "../factory";

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { src, dst, amount } = data;
  const liquidityClient = factory.getLiquidityClient();
  const tokenService = factory.getTokenClient();

  const [srcToken, dstToken] = await tokenService.getTokens({
    addresses: [src, dst],
  });

  const { dstAmount, protocols, strategy } = await liquidityClient.quote({
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

  const resp: APIQuoteResponse = {
    price: getPrice(dstAmount),
    buyTokenAddress: dstToken.address,
    buyAmount: dstAmount,
    sellAmount: amount,
    sellTokenAddress: srcToken.address,
    protocols,
    strategy,
  };

  return resp;
};

export async function GET(request: Request) {
  return handleApiRequest({
    schema,
    request,
    handler: handleRequest,
  });
}
