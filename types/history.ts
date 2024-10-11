import { Token } from "./base";

export type HistoryItemStatus = "pending" | "failed" | "success";

export type HistoryItem = {
  fromToken: Token;
  fromAmount: string;
  toToken: Token;
  toAmount: string;
  status: HistoryItemStatus;
  txHash: string;
};
