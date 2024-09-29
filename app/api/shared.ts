import { createPublicClient, http, PublicClient } from "viem";
import { polygon } from "viem/chains";

import { TokenService } from "@/lib/token/token";
import { UniswapV2Client } from "@/liquidity-client/uniswap-v2/client";
import { settings as UniswapSetting } from "@/liquidity-client/uniswap-v2/setting";
import { UniswapV3Client } from "@/liquidity-client/uniswap-v3/client";
import { settings as UniswapV3Setting } from "@/liquidity-client/uniswap-v3/setting";

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

export const createUniswapService = ({ client }: { client: PublicClient }) => {
  return new UniswapV2Client({
    routerAddress: UniswapSetting["137"].routerAddress,
    providerConfig: UniswapSetting["137"].providerConfig,
    weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    basePairs: UniswapSetting["137"].base,
    client,
  });
};

export const createTokenService = ({ client }: { client: PublicClient }) => {
  return new TokenService({ client });
};

export const createUniswapV3Service = ({
  client,
}: {
  client: PublicClient;
}) => {
  return new UniswapV3Client({
    routerAddress: UniswapV3Setting["137"].routerAddress,
    factoryAddress: UniswapV3Setting["137"].factoryAddress,
    quoterAddress: UniswapV3Setting["137"].quoterAddress,
    weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",

    initCode: UniswapV3Setting["137"].initCode,
    basePairs: UniswapV3Setting["137"].base,
    client,
  });
};
