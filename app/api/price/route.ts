import { isAddress } from "viem";
import { z } from "zod";

import { handleApiRequest } from "@/lib/validate";
import { APIPriceResponse } from "@/types/apis";

import { createClient, createPriceClient } from "../shared";

const schema = z.object({
  tokenAddresses: z
    .string()
    .refine((o) => isAddress(o))
    .array(),
});

const handleRequest = async (data: z.infer<typeof schema>) => {
  const client = createClient();
  const priceClient = createPriceClient({ client });
  const resp = await priceClient.getPrice({
    tokenAddresses: data.tokenAddresses,
  });
  return { prices: resp } as APIPriceResponse;
};

export async function POST(request: Request) {
  return handleApiRequest(schema, request, handleRequest, true);
}
