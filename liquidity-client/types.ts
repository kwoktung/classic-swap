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
};

export interface LiquidityClient {
  getPrice(args: GetPriceArgs): Promise<GetPriceResponse>;
  buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse>;
}
