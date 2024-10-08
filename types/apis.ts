import { Token } from "./base";

export type APITokensResponse = {
  assets: Token[];
};

export type APIBalanceResponse = {
  balances: Record<string, string>;
};

export type APIPriceResponse = {
  prices: Record<string, string>;
};
