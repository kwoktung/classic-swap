import { Address, Hex } from "viem";

export type UniswapV3Pair = {
  token0: Address;
  token1: Address;
  address: Address;
  fee: number;
};

export type UniswapV3Config = {
  routerAddress: Address;
  factoryAddress: Address;
  quoterAddress: Address;
  base: Address[];
  initCode: Hex;
};

export type UniswapV3Path = {
  firstToken: Address;
  pools: UniswapV3Pair[];
  amountOut: string;
};
