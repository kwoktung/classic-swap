import BigNumber from "bignumber.js";

import {
  LiquidityClient,
  LiquidityProvider,
  QuoteArgs,
  QuoteResponse,
  SwapArgs,
  SwapResponse,
} from "./types";

export class MixedLiquidityClient implements LiquidityClient {
  private sources: LiquidityProvider[];

  constructor({ sources }: { sources: LiquidityProvider[] }) {
    this.sources = sources;
  }

  async quote(args: QuoteArgs): Promise<QuoteResponse> {
    const { dst, src, amount } = args;
    const promises = this.sources.map((source) =>
      source.getPrice({ src, dst, amount }),
    );
    const done = await Promise.allSettled(promises);
    const fulfilled = done.filter((o) => o.status === "fulfilled");
    const sorted = fulfilled.sort((a, b) =>
      BigNumber(a.value.dstAmount).gt(b.value.dstAmount) ? -1 : 1,
    );
    if (sorted.length === 0) {
      throw new Error("no paths found");
    }
    return { dstAmount: sorted[0].value.dstAmount };
  }

  async swap(args: SwapArgs): Promise<SwapResponse> {
    const { dst, src, amount, slippage, to } = args;
    const promises = this.sources.map((source) =>
      source.buildTransaction({ dst, src, amount, slippage, to }),
    );
    const done = await Promise.allSettled(promises);
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
