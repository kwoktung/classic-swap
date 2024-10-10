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

export type ChainExplorerConfig = {
  name: string;
  address: string;
  block: string;
  transaction: string;
};

export type Chain = {
  name: string;
  shortName: string;
  chainId: string;
  explorer: ChainExplorerConfig;
  weth9: Address;
};
