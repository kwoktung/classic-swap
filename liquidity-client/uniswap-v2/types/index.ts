import type { Address, Hex } from "viem";

export type UniswapV2Pair = {
  token0: Address;
  token1: Address;
  address: Address;
};

export type UniswapV2ProviderConfig = {
  factoryAddress: Address;
  initCode: Hex;
};

export type UniswapSetting = {
  routerAddress: Address;
  base: Address[];
  providerConfig: UniswapV2ProviderConfig[];
};
