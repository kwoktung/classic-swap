import { createPublicClient, http, PublicClient } from "viem";
import { polygon } from "viem/chains";

import { MixedLiquidityClient } from "@/client/liquidity/liquidity-client";
import { TokenClient } from "@/client/token";

export const createClient = () => {
  return createPublicClient({
    chain: polygon,
    transport: http(process.env.POLYGON_RPC),
    batch: {
      multicall: true,
    },
    pollingInterval: 0,
  });
};

export const createTokenService = ({ client }: { client: PublicClient }) => {
  return new TokenClient({ client });
};

export const createLiquidityClient = ({ client }: { client: PublicClient }) => {
  return new MixedLiquidityClient({
    client,
    weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
  });
};
