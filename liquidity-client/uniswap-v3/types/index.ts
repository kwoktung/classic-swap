import { Address, Hex } from "viem";

export type UniswapV3Pair = {
  token0: Address;
  token1: Address;
  address: Address;
  fee: number;
};

export type UniswapV3Setting = {
  routerAddress: Address;
  factoryAddress: Address;
  quoterAddress: Address;
  base: Address[];
  initCode: Hex;
};
