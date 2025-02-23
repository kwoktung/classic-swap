import { Address } from "viem";

import { Token } from "./base";

export type HistoryItemStatus = "pending" | "failed" | "success";

export type HistoryItem = {
  fromToken: Token;
  fromAmount: string;
  toToken: Token;
  toAmount: string;
  status: HistoryItemStatus;
  txHash: string;
  createAt: number;
  address: Address;
  chainId: number;
};
