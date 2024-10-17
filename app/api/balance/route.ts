import BigNumber from "bignumber.js";
import { keyBy } from "lodash";
import { Address, isAddress } from "viem";
import { z } from "zod";

import { assets } from "@/lib/assets";
import { validateRequest } from "@/lib/validate";
import { APIBalanceResponse } from "@/types/apis";

import { createClient, createTokenService } from "../shared";

const schema = z.object({
  accountAddress: z.string().refine((o) => isAddress(o)),
  tokenAddresses: z
    .string()
    .refine((o) => isAddress(o))
    .array(),
});

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { accountAddress } = data;
  const client = createClient();
  const tokenService = createTokenService({ client });

  const balanceResp = await tokenService.getBalances({
    tokenAddresses: assets.map((o) => o.address),
    accountAddress: accountAddress as Address,
  });
  const assetMap = keyBy(assets, "address");
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

export async function GET(request: Request) {
  const validation = await validateRequest(schema, request);
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
