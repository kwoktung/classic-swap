import type { Address } from "viem";

import { EVMTransaction } from "@/types/base";

export type GetPriceArgs = {
  src: Address;
  dst: Address;
  amount: string;
};

export type GetPriceResponse = {
  dstAmount: string;
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

export type LiquidityProviderName = "UniswapV2" | "UniswapV3";

export interface LiquidityProvider {
  name: LiquidityProviderName;
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
