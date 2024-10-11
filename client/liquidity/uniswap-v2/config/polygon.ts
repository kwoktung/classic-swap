import type { UniswapV2Config, UniswapV2FactoryConfig } from "../types";

// https://github.com/QuickSwap/QuickSwap-sdk/blob/master/src/constants.ts
// TODO: 1. limit base tokens 2. request min liquidity
const factoryConfig: UniswapV2FactoryConfig[] = [
  {
    protocol: "QuickSwap",
    factoryAddress: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
    initCode:
      "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f",
  },
  {
    protocol: "Ape",
    factoryAddress: "0xCf083Be4164828f00cAE704EC15a36D711491284",
    initCode:
      "0x511f0f358fe530cda0859ec20becf391718fdf5a329be02f4c95361f3d6a42d8",
  },
  //   {
  //     protocol: "Dfyn",
  //     factoryAddress: "0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B",
  //     initCode:
  //       "0xf187ed688403aa4f7acfada758d8d53698753b998a3071b06f1b777f4330eaf3",
  //   },
  //   {
  //     protocol: "Elk",
  //     factoryAddress: "0xE3BD06c7ac7E1CeB17BdD2E5BA83E40D1515AF2a",
  //     initCode:
  //       "0x84845e7ccb283dec564acfcd3d9287a491dec6d675705545a2ab8be22ad78f31",
  //   },
  //   {
  //     protocol: "JetSwap",
  //     factoryAddress: "0x668ad0ed2622C62E24f0d5ab6B6Ac1b9D2cD4AC7",
  //     initCode:
  //       "0x505c843b83f01afef714149e8b174427d552e1aca4834b4f9b4b525f426ff3c6",
  //   },
];

export const polygonConfig: UniswapV2Config = {
  base: [
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  ],
  routerAddress: "0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607",
  factoryConfig,
};
