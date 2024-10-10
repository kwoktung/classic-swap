import type { UniswapV3Config } from "../types";

export const polygonConfig = {
  routerAddress: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  initCode:
    "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54",
  base: [
    "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a",
    "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  ],
  quoterAddress: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
} as UniswapV3Config;
