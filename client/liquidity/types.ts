import type { Address } from "viem";

import { EVMTransaction } from "@/types/base";

export type GetPriceArgs = {
  src: Address;
  dst: Address;
  amount: string;
};

export type GetPriceResponse = {
  dstAmount: string;
  protocols?: string[];
};

export type BuildTransactionArgs = {
  src: Address;
  dst: Address;
  amount: string;
  to: Address;
  slippage: number;
};

export type BuildTransactionResponse = {
  tx: EVMTransaction;
  dstAmount: string;
};

export type LiquidityStrategyName = "UniswapV2" | "UniswapV3";

export interface LiquidityStrategyProvider {
  name: LiquidityStrategyName;
  getPrice(args: GetPriceArgs): Promise<GetPriceResponse>;
  buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse>;
}

type LiquidityType = "swap" | "wrap" | "unwrap";

export type QuoteArgs = {
  src: Address;
  dst: Address;
  amount: string;
};

export type QuoteResponse = {
  dstAmount: string;
  protocols?: string[];
  strategyName: LiquidityStrategyName;
};

export type SwapArgs = {
  src: Address;
  dst: Address;
  amount: string;
  to: Address;
  slippage: number;
};

export type SwapResponse = {
  tx: EVMTransaction;
};

export interface LiquidityClient {
  quote(args: QuoteArgs): Promise<QuoteResponse>;
  swap(args: SwapArgs): Promise<SwapResponse>;
}
