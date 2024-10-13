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

export type LiquidityStrategy = "UniswapV2" | "UniswapV3" | "WETH9";

export interface LiquidityProvider {
  name: LiquidityStrategy;
  getPrice(args: GetPriceArgs): Promise<GetPriceResponse>;
  buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse>;
}

export type QuoteArgs = {
  src: Address;
  dst: Address;
  amount: string;
};

export type QuoteResponse = {
  dstAmount: string;
  protocols?: string[];
  strategy: LiquidityStrategy;
};

export type SwapArgs = {
  src: Address;
  dst: Address;
  amount: string;
  to: Address;
  slippage: number;
};

type SwapTransactionType = "swap" | "withdraw" | "deposit";

export type SwapResponse = {
  tx: EVMTransaction;
  type: SwapTransactionType;
};

export interface LiquidityClient {
  quote(args: QuoteArgs): Promise<QuoteResponse>;
  swap(args: SwapArgs): Promise<SwapResponse>;
}
