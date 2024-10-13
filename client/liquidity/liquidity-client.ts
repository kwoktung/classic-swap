import BigNumber from "bignumber.js";
import { Address, PublicClient } from "viem";

import { isNativeToken } from "@/lib/address";

import {
  LiquidityClient,
  LiquidityProvider,
  QuoteArgs,
  QuoteResponse,
  SwapArgs,
  SwapResponse,
} from "./types";
import { UniswapV2Client } from "./uniswap-v2/client";
import { config as UniswapV2Config } from "./uniswap-v2/config";
import { UniswapV3Client } from "./uniswap-v3/client";
import { settings as UniswapV3Config } from "./uniswap-v3/config";
import { Weth9Client } from "./weth9/client";

export class MixedLiquidityClient implements LiquidityClient {
  private sources: LiquidityProvider[];

  private weth9Client: Weth9Client;

  constructor({
    client,
    weth9Address,
  }: {
    client: PublicClient;
    weth9Address: Address;
  }) {
    const v2 = new UniswapV2Client({
      routerAddress: UniswapV2Config["137"].routerAddress,
      factoryConfig: UniswapV2Config["137"].factoryConfig,
      basePairs: UniswapV2Config["137"].base,
      weth9Address,
      client,
    });
    const v3 = new UniswapV3Client({
      routerAddress: UniswapV3Config["137"].routerAddress,
      factoryAddress: UniswapV3Config["137"].factoryAddress,
      quoterAddress: UniswapV3Config["137"].quoterAddress,
      initCode: UniswapV3Config["137"].initCode,
      basePairs: UniswapV3Config["137"].base,
      weth9Address,
      client,
    });

    this.weth9Client = new Weth9Client({ weth9Address });

    this.sources = [v2, v3];
  }

  async quote(args: QuoteArgs): Promise<QuoteResponse> {
    const { dst, src, amount } = args;

    if (this.weth9Client.isWeth9Pair({ src, dst })) {
      return { dstAmount: amount, protocols: [], strategy: "WETH9" };
    }

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

    const [strategy, priceResp] = sorted[0].value;
    return {
      dstAmount: priceResp.dstAmount,
      protocols: priceResp.protocols,
      strategy,
    };
  }

  async swap(args: SwapArgs): Promise<SwapResponse> {
    const { dst, src, amount, slippage, to } = args;

    const isWeth9Pair = this.weth9Client.isWeth9Pair({ src, dst });

    if (isWeth9Pair) {
      const { tx } = await this.weth9Client.buildTransaction(args);
      return { tx, type: isNativeToken(src) ? "deposit" : "withdraw" };
    }

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

    return { tx: fulfilled[0].value.tx, type: "swap" };
  }
}
