import BigNumber from "bignumber.js";
import { keyBy } from "lodash";
import { Address, isAddress } from "viem";
import { z } from "zod";

import { handleApiRequest } from "@/lib/validate";
import { APIBalanceResponse } from "@/types/apis";

import { factory } from "../factory";

const schema = z.object({
  accountAddress: z.string().refine((o) => isAddress(o)),
  tokenAddresses: z
    .string()
    .refine((o) => isAddress(o))
    .array(),
});

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { accountAddress, tokenAddresses } = data;
  const tokenClient = factory.getTokenClient();

  const [balanceResp, tokenResp] = await Promise.all([
    tokenClient.getBalances({
      tokenAddresses,
      accountAddress: accountAddress as Address,
    }),
    tokenClient.getTokens({ addresses: tokenAddresses }),
  ]);

  const assetMap = keyBy(tokenResp, "address");
  const balances: Record<string, string> = {};
  Object.entries(balanceResp).forEach(([address, value]) => {
    const decimals = assetMap[address]?.decimals;
    if (Number(decimals) > 0 && Number(value) > 0) {
      balances[address] = BigNumber(value).shiftedBy(-decimals).toFixed();
    }
  });
  const resp: APIBalanceResponse = { balances };
  return resp;
};

export async function POST(request: Request) {
  return handleApiRequest({
    schema,
    request,
    handler: handleRequest,
    validateBody: true,
  });
}
