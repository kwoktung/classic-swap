import BigNumber from "bignumber.js";
import { PublicClient } from "viem";

import {
  LiquidityClient,
  LiquidityStrategyProvider,
  QuoteArgs,
  QuoteResponse,
  SwapArgs,
  SwapResponse,
} from "./types";
import { UniswapV2Client } from "./uniswap-v2/client";
import { config as UniswapV2Config } from "./uniswap-v2/config";
import { UniswapV3Client } from "./uniswap-v3/client";
import { settings as UniswapV3Config } from "./uniswap-v3/config";

// TODO support weth9
export class MixedLiquidityClient implements LiquidityClient {
  private sources: LiquidityStrategyProvider[];

  constructor({ client }: { client: PublicClient }) {
    const v2 = new UniswapV2Client({
      routerAddress: UniswapV2Config["137"].routerAddress,
      factoryConfig: UniswapV2Config["137"].factoryConfig,
      weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      basePairs: UniswapV2Config["137"].base,
      client,
    });
    const v3 = new UniswapV3Client({
      routerAddress: UniswapV3Config["137"].routerAddress,
      factoryAddress: UniswapV3Config["137"].factoryAddress,
      quoterAddress: UniswapV3Config["137"].quoterAddress,
      weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",

      initCode: UniswapV3Config["137"].initCode,
      basePairs: UniswapV3Config["137"].base,
      client,
    });

    this.sources = [v2, v3];
  }

  async quote(args: QuoteArgs): Promise<QuoteResponse> {
    const { dst, src, amount } = args;
    const getPriceResp = this.sources.map((source) => {
      return Promise.all([source.name, source.getPrice({ src, dst, amount })]);
    });
    const done = await Promise.allSettled(getPriceResp);
    const fulfilled = done.filter((o) => o.status === "fulfilled");
    const sorted = fulfilled.sort((a, b) => {
      const [, priceRespA] = a.value;
      const [, priceRespB] = b.value;
      return BigNumber(priceRespA.dstAmount).gt(priceRespB.dstAmount) ? -1 : 1;
    });

    if (sorted.length === 0) {
      throw new Error("no paths found");
    }

    const [name, priceResp] = sorted[0].value;
    return {
      dstAmount: priceResp.dstAmount,
      strategyName: name,
      protocols: priceResp.protocols,
    };
  }

  async swap(args: SwapArgs): Promise<SwapResponse> {
    const { dst, src, amount, slippage, to } = args;
    const buildTransactionResp = this.sources.map((source) =>
      source.buildTransaction({ dst, src, amount, slippage, to }),
    );
    const done = await Promise.allSettled(buildTransactionResp);
    const fulfilled = done.filter((o) => o.status === "fulfilled");

    const sorted = fulfilled.sort((a, b) =>
      BigNumber(a.value.dstAmount).gt(b.value.dstAmount) ? -1 : 1,
    );

    if (sorted.length === 0) {
      throw new Error("no path found");
    }

    return fulfilled[0].value;
  }
}
