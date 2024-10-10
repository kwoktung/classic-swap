import type { Address, Hex } from "viem";

export type UniswapV2Pair = {
  token0: Address;
  token1: Address;
  address: Address;
  protocol: string;
};

export type UniswapV2FactoryConfig = {
  protocol: string;
  factoryAddress: Address;
  initCode: Hex;
};

export type UniswapV2Config = {
  routerAddress: Address;
  base: Address[];
  factoryConfig: UniswapV2FactoryConfig[];
};

export type UniswapV2Path = {
  pools: UniswapV2Pool[];
  amountOut: string;
};

export type UniswapV2Pool = {
  protocol: string;
  token0: string;
  token1: string;
  address: string;
  reserve0: string;
  reserve1: string;
};
