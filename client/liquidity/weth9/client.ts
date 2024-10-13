import { Address, encodeFunctionData, toHex } from "viem";

import { isNativeToken, nativeAddress } from "@/lib/address";

import {
  BuildTransactionArgs,
  BuildTransactionResponse,
  GetPriceArgs,
  GetPriceResponse,
  LiquidityProvider,
  LiquidityStrategy,
} from "../types";
import { wethAbi } from "./weth9Abi";

export class Weth9Client implements LiquidityProvider {
  name: LiquidityStrategy = "WETH9";
  private weth9Address: Address;

  constructor({ weth9Address }: { weth9Address: Address }) {
    this.weth9Address = weth9Address;
  }

  isWeth9Pair({ src, dst }: { src: Address; dst: Address }) {
    const tokens = [nativeAddress, this.weth9Address];
    const result = tokens.includes(src) && tokens.includes(dst) && src !== dst;
    return result;
  }

  async getPrice(args: GetPriceArgs): Promise<GetPriceResponse> {
    return { dstAmount: args.amount };
  }

  async buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse> {
    const { src, dst, amount } = args;
    if (isNativeToken(src)) {
      const data = encodeFunctionData({
        abi: wethAbi,
        functionName: "deposit",
      });
      return {
        tx: { data, to: this.weth9Address, value: toHex(BigInt(amount)) },
        dstAmount: amount,
      };
    } else {
      const data = encodeFunctionData({
        abi: wethAbi,
        functionName: "withdraw",
        args: [BigInt(amount)],
      });
      return {
        tx: { data, to: this.weth9Address, value: "0x0" },
        dstAmount: amount,
      };
    }
  }
}
