import { chunk } from "lodash";
import qs from "qs";
import { isAddress } from "viem";
import { z } from "zod";

import { httpClient } from "@/lib/client";
import { APIPriceResponse } from "@/types/apis";

const schema = z.object({
  tokenAddresses: z
    .string()
    .refine((o) => isAddress(o))
    .array(),
});

const fetchTokenPrice = async (tokenAddresses: string[]) => {
  const addresses = tokenAddresses.join(",");
  const network = "polygon_pos";
  const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${addresses}`;
  const httpResp = await httpClient.get<{
    data: {
      id: string;
      type: string;
      attributes: { token_prices: Record<string, string> };
    };
  }>(url);
  return httpResp.data.data.attributes.token_prices;
};

const handleRequest = async (data: z.infer<typeof schema>) => {
  const { tokenAddresses } = data;
  const tokenAddressChuck = chunk(tokenAddresses, 30);
  const priceList = await Promise.all(
    tokenAddressChuck.map((o) => fetchTokenPrice(o)),
  );
  const resp: APIPriceResponse = {
    prices: priceList.reduce(
      (a, b) => ({ ...a, ...b }),
      {} as Record<string, string>,
    ),
  };
  return resp;
};

export async function GET(request: Request) {
  const { search } = new URL(request.url);
  const validate = schema.safeParse(qs.parse(search.slice(1), { comma: true }));
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
