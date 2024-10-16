import { EVMTransaction, Token } from "./base";

export type APITokensResponse = {
  assets: Token[];
};

export type APIBalanceResponse = {
  balances: Record<string, string>;
};

export type APIPriceResponse = {
  prices: Record<string, string>;
};

export type APIQuoteResponse = {
  price: string;
  buyTokenAddress: string;
  buyAmount: string;
  sellAmount: string;
  sellTokenAddress: string;
  protocols?: string[];
  strategy: string;
};

export type APISwapResponse = {
  tx: EVMTransaction;
  type: string;
  amountOut: string;
};
