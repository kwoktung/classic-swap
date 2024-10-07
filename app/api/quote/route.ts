import { BigNumber } from "bignumber.js";
import { fromPairs } from "lodash";
import { isAddress } from "viem";
import { unknown, z } from "zod";

const schema = z.object({
  src: z.string().refine((val) => isAddress(val)),
  dst: z.string().refine((val) => isAddress(val)),
  amount: z.coerce.string(),
});

import {
  createClient,
  createTokenService,
  createUniswapService,
  createUniswapV3Service,
} from "../shared";

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { src, dst, amount } = data;
  const client = createClient();
  const uniswapV2Service = createUniswapService({ client });
  const tokenService = createTokenService({ client });

  const [srcToken, dstToken] = await tokenService.getTokens({
    addresses: [src, dst],
  });

  const { dstAmount } = await uniswapV2Service.getPrice({
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
    allowanceTarget: uniswapV2Service.routerAddress,
  };

  return resp;
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
    return Response.json({ error: message }, { status: 400 });
  }

  try {
    const result = await handleRequest(validate.data);
    return Response.json(result);
  } catch (e: unknown) {
    return Response.json({ message: (e as Error).message }, { status: 500 });
  }
}
