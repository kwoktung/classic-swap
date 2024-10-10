import BigNumber from "bignumber.js";
import { flatten, unionBy, uniq } from "lodash";
import type { Address, Hex, PublicClient, zeroAddress } from "viem";
import {
  encodeFunctionData,
  encodePacked,
  getCreate2Address,
  keccak256,
  toHex,
} from "viem";

import { isNativeToken } from "@/lib/address";

import type {
  BuildTransactionArgs,
  BuildTransactionResponse,
  GetPriceArgs,
  GetPriceResponse,
  LiquidityStrategyName,
  LiquidityStrategyProvider,
} from "../types";
import { PairAbi } from "./abis/Pair";
import { RouterAbi } from "./abis/Router02";
import type {
  UniswapV2FactoryConfig,
  UniswapV2Pair,
  UniswapV2Path,
  UniswapV2Pool,
} from "./types";

// https://github.com/QuickSwap/QuickSwap-sdk/blob/master/src/constants.ts
// TODO: 1. limit base tokens 2. request min liquidity
export class UniswapV2Client implements LiquidityStrategyProvider {
  readonly name: LiquidityStrategyName = "UniswapV2";
  private readonly routerAddress: Address;
  private readonly weth9Address: Address;

  private baseAddresses: Address[];

  private factoryConfig: UniswapV2FactoryConfig[];

  private client: PublicClient;

  constructor(props: {
    routerAddress: Address;
    weth9Address: Address;

    basePairs: Address[];
    client: PublicClient;

    factoryConfig: UniswapV2FactoryConfig[];
  }) {
    this.weth9Address = props.weth9Address;

    this.routerAddress = props.routerAddress;

    this.factoryConfig = props.factoryConfig;

    this.baseAddresses = props.basePairs;
    this.client = props.client;
  }

  private getPairAddress({
    tokenA,
    tokenB,
    factoryAddress,
    initCode,
    protocol,
  }: {
    tokenA: Address;
    tokenB: Address;
    factoryAddress: Address;
    initCode: Hex;
    protocol: string;
  }): UniswapV2Pair {
    const [token0, token1] =
      tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA]; // does safety checks

    const address = getCreate2Address({
      from: factoryAddress,
      salt: keccak256(encodePacked(["address", "address"], [token0, token1])),
      bytecodeHash: initCode,
    });
    return { token0, token1, address, protocol };
  }

  private getPairs({
    srcToken,
    dstToken,
  }: {
    srcToken: Address;
    dstToken: Address;
  }): [Address, Address][] {
    const bases = this.baseAddresses;
    const basePairs: [Address, Address][] = bases
      .flatMap((address, _, array) =>
        array.map(
          (otherAddress) => [address, otherAddress] as [Address, Address],
        ),
      )
      .filter(([a, b]) => a !== b);
    const tokens: [Address, Address][] = [
      [srcToken, dstToken],
      ...bases.map((base): [Address, Address] => [srcToken, base]),
      ...bases.map((base): [Address, Address] => [dstToken, base]),
      ...basePairs,
    ];
    return tokens;
  }

  private getAmountOut({
    tokenIn,
    amountIn,
    pool,
  }: {
    amountIn: string;
    tokenIn: string;
    pool: UniswapV2Pool;
  }) {
    const { reserve0, reserve1, token0, token1 } = pool;
    const [reserveIn, reserveOut] =
      tokenIn === token0 ? [reserve0, reserve1] : [reserve1, reserve0];

    const amountInWithFee = BigNumber(amountIn).multipliedBy(997);
    const numerator = BigNumber(amountInWithFee).multipliedBy(reserveOut);
    const denominator = BigNumber(reserveIn)
      .multipliedBy(1000)
      .plus(amountInWithFee);
    return {
      amountOut: numerator.div(denominator).toFixed(0),
      address: tokenIn === token0 ? token1 : token0,
    };
  }

  private async getPoolFromPair(
    pairs: UniswapV2Pair[],
  ): Promise<UniswapV2Pool[]> {
    const reservesResp = await this.client.multicall({
      contracts: pairs.map(
        (o) =>
          ({
            abi: PairAbi,
            address: o.address as Address,
            functionName: "getReserves",
          }) as const,
      ),
      allowFailure: true,
    });
    const pools: UniswapV2Pool[] = [];
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const data = reservesResp[i];
      if (data.status === "success") {
        const result = data.result;
        const pool: UniswapV2Pool = {
          token0: pair.token0,
          token1: pair.token1,
          address: pair.address,
          reserve0: BigNumber(Number(result[0])).toFixed(0),
          reserve1: BigNumber(Number(result[1])).toFixed(0),
          protocol: pair.protocol,
        };
        pools.push(pool);
      }
    }
    return pools;
  }

  private searchPaths({
    pools,
    amountIn,
    tokenIn,
    tokenOut,
    currentPools = [],
    result = [],
  }: {
    pools: UniswapV2Pool[];
    amountIn: string;
    tokenIn: string;
    tokenOut: string;
    currentPools?: UniswapV2Pool[];
    result?: UniswapV2Path[];
  }) {
    for (let i = 0; i < pools.length; i += 1) {
      const pool = pools[i];
      if (pool.token0 !== tokenIn && pool.token1 !== tokenIn) continue;
      if (
        BigNumber(pool.reserve0).isZero() ||
        BigNumber(pool.reserve1).isZero()
      )
        continue;
      const { address, amountOut } = this.getAmountOut({
        amountIn,
        tokenIn,
        pool,
      });
      if (address === tokenOut) {
        result.push({ pools: currentPools.concat(pool), amountOut });
      } else if (currentPools.length <= 3) {
        const restPools = pools.slice(0, i).concat(pools.slice(i + 1));
        this.searchPaths({
          pools: restPools,
          amountIn: amountOut,
          tokenIn: address,
          tokenOut,
          currentPools: currentPools.concat(pool),
          result,
        });
      }
    }
  }

  private getPoolsPath(pools: UniswapV2Pool[], tokenIn: string): string[] {
    const paths = pools.reduce(
      (result, pool) => {
        const current = result[0];
        if (current !== pool.token0) {
          return result.concat(pool.token0);
        } else if (current !== pool.token1) {
          return result.concat(pool.token1);
        } else {
          throw new Error("invalid path");
        }
      },
      [tokenIn],
    );
    return paths;
  }

  private async getPath(params: {
    src: Address;
    dst: Address;
    amount: string;
  }): Promise<UniswapV2Path> {
    const src = isNativeToken(params.src) ? this.weth9Address : params.src;
    const dst = isNativeToken(params.dst) ? this.weth9Address : params.dst;

    const nestedAllPairs = this.factoryConfig.map((factoryConf) => {
      const pairs = this.getPairs({ srcToken: src, dstToken: dst }).map(
        ([token0, token1]) =>
          this.getPairAddress({
            tokenA: token0,
            tokenB: token1,
            factoryAddress: factoryConf.factoryAddress,
            initCode: factoryConf.initCode,
            protocol: factoryConf.protocol,
          }),
      );
      return pairs;
    });

    const pairs = unionBy(flatten(nestedAllPairs), "address");

    const pairReserves = await this.getPoolFromPair(pairs);

    const paths: UniswapV2Path[] = [];

    this.searchPaths({
      pools: pairReserves,
      amountIn: params.amount,
      tokenIn: src,
      tokenOut: dst,
      result: paths,
    });

    if (paths.length === 0) {
      throw new Error("no paths found");
    }

    paths.sort((a, b) => {
      if (a.pools.length === b.pools.length) {
        return a.amountOut > b.amountOut ? -1 : 1;
      } else {
        return a.pools.length - b.pools.length;
      }
    });

    const { pools, amountOut } = paths[0];

    if (Number(amountOut) === 0) {
      throw new Error("no path found");
    }

    return {
      amountOut,
      pools,
    };
  }

  async getPrice(args: GetPriceArgs): Promise<GetPriceResponse> {
    const { src, dst, amount } = args;
    const { amountOut, pools } = await this.getPath({
      src,
      dst,
      amount,
    });
    return {
      dstAmount: amountOut,
      protocols: uniq(pools.map((o) => o.protocol)),
    };
  }

  async buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse> {
    const { amount, src, dst, to, slippage = 1 } = args;

    const { amountOut, pools } = await this.getPath({
      src,
      dst,
      amount,
    });

    const paths = this.getPoolsPath(pools, src);

    const amountOutMin = BigNumber(amountOut)
      .multipliedBy(100 - Number(slippage))
      .div(100)
      .toFixed(0);

    const latestBlock = await this.client.getBlock({ blockTag: "latest" });
    const deadline = latestBlock.timestamp + BigInt(60 * 60 * 1000);

    if (isNativeToken(src)) {
      const data = encodeFunctionData({
        abi: RouterAbi,
        functionName: "swapExactETHForTokens",
        args: [BigInt(amountOutMin), paths as Address[], to, BigInt(deadline)],
      });

      return {
        tx: {
          data,
          value: toHex(BigInt(amount)),
          to: this.routerAddress,
        },
        dstAmount: amountOut,
      };
    } else if (isNativeToken(dst)) {
      const data = encodeFunctionData({
        abi: RouterAbi,
        functionName: "swapExactTokensForETH",
        args: [
          BigInt(amount),
          BigInt(amountOutMin),
          paths as Address[],
          to,
          BigInt(deadline),
        ],
      });
      return {
        tx: { data, to: this.routerAddress, value: "0x0" },
        dstAmount: amountOut,
      };
    } else {
      const data = encodeFunctionData({
        abi: RouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          BigInt(amount),
          BigInt(amountOutMin),
          paths as Address[],
          to as Address,
          BigInt(deadline),
        ],
      });
      return {
        tx: { data, to: this.routerAddress, value: "0x0" },
        dstAmount: amountOut,
      };
    }
  }
}
