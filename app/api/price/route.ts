import { isAddress } from "viem";
import { z } from "zod";

import { validateRequest } from "@/lib/validate";
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
  const validation = await validateRequest(schema, request, true);
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
