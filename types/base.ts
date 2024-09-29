import type { Address, Hex } from "viem";

export type EVMTransaction = {
  data: Hex;
  to: Address;
  value: Hex;
};

export type Token = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};
