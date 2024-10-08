import BigNumber from "bignumber.js";
import { flatten, unionBy } from "lodash";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContract,
  getCreate2Address,
  Hex,
  keccak256,
  PublicClient,
  toHex,
} from "viem";

import { isNativeToken } from "@/lib/address";

import {
  BuildTransactionArgs,
  BuildTransactionResponse,
  GetPriceArgs,
  GetPriceResponse,
  LiquidityProvider,
  LiquidityProviderName,
} from "../types";
import { PoolABI } from "./abis/Pool";
import { QuoterABI } from "./abis/Quoter";
import { SwapRouterABI } from "./abis/SwapRouter";
import { UniswapV3Pair } from "./types";

type UniswapV3Solution = {
  firstToken: Address;
  pools: UniswapV3Pair[];
  amountOut: string;
};

export class UniswapV3Client implements LiquidityProvider {
  name: LiquidityProviderName = "UniswapV3";

  readonly routerAddress: Address;
  readonly weth9Address: Address;
  private quoterAddress: Address;

  private factoryAddress: Address;
  private initCode: string;
  private basePairs: Address[];

  private client: PublicClient;
  constructor(props: {
    routerAddress: Address;
    factoryAddress: Address;
    quoterAddress: Address;
    weth9Address: Address;

    initCode: string;
    basePairs: Address[];
    client: PublicClient;
  }) {
    this.routerAddress = props.routerAddress;
    this.weth9Address = props.weth9Address;
    this.quoterAddress = props.quoterAddress;
    this.factoryAddress = props.factoryAddress;

    this.initCode = props.initCode;
    this.basePairs = props.basePairs;
    this.client = props.client;
  }

  private getPairAddress(params: {
    tokenA: Address;
    tokenB: Address;
    fee: number;
  }): UniswapV3Pair {
    const { tokenA, tokenB, fee } = params;
    const [token0, token1] =
      tokenA.toLowerCase() < tokenB.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA]; // does safety checks

    const salt = keccak256(
      encodeAbiParameters(
        [
          { name: "token0", type: "address" },
          { name: "token1", type: "address" },
          { name: "fee", type: "uint24" },
        ],
        [token0, token1, fee],
      ),
    );

    const address = getCreate2Address({
      from: this.factoryAddress,
      salt,
      bytecodeHash: this.initCode as Hex,
    });
    return { address, token0, token1, fee };
  }

  private getPairs(tokenA: Address, tokenB: Address): [Address, Address][] {
    const bases = this.basePairs.map((o) => o);
    const basePairs: [Address, Address][] = bases
      .flatMap((address, _, array) =>
        array.map(
          (otherAddress) => [address, otherAddress] as [Address, Address],
        ),
      )
      .filter(([a, b]) => a !== b);
    const tokens: [Address, Address][] = [
      [tokenA, tokenB],
      ...bases.map((base): [Address, Address] => [tokenA, base]),
      ...bases.map((base): [Address, Address] => [tokenB, base]),
      ...basePairs,
    ];
    return tokens.filter((o) => o[0] !== o[1]);
  }

  private async getAvailablePairs(
    pairs: UniswapV3Pair[],
  ): Promise<UniswapV3Pair[]> {
    const resp = await this.client.multicall({
      contracts: pairs.map(
        (o) =>
          ({
            abi: PoolABI,
            address: o.address as Address,
            functionName: "liquidity",
            args: [],
          }) as const,
      ),
      allowFailure: true,
    });
    const pools: UniswapV3Pair[] = [];
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const data = resp[i];
      if (data.status === "success") {
        pools.push(pair);
      }
    }
    return pools;
  }

  private searchOptimalPath({
    pools,
    tokenIn,
    tokenOut,
    currentPools = [],
    result = [],
  }: {
    pools: UniswapV3Pair[];
    tokenIn: string;
    tokenOut: string;
    currentPools?: UniswapV3Pair[];
    result?: UniswapV3Pair[][];
  }) {
    for (let i = 0; i < pools.length; i += 1) {
      const pair = pools[i];
      if (pair.token0 !== tokenIn && pair.token1 !== tokenIn) continue;
      const address = pair.token0 === tokenIn ? pair.token1 : pair.token0;
      if (address === tokenOut) {
        result.push(currentPools.concat(pair));
      } else if (currentPools.length <= 3) {
        const restPairs = pools.slice(0, i).concat(pools.slice(i + 1));
        this.searchOptimalPath({
          pools: restPairs,
          tokenIn: address,
          tokenOut,
          currentPools: currentPools.concat(pair),
          result,
        });
      }
    }
  }

  private encodeRouteToPath = (pools: UniswapV3Pair[], input: string) => {
    const { path, types } = pools.reduce(
      (
        {
          inputToken,
          path,
          types,
        }: { inputToken: string; path: (string | number)[]; types: string[] },
        pool: UniswapV3Pair,
        index,
      ): { inputToken: string; path: (string | number)[]; types: string[] } => {
        const outputToken =
          pool.token0 === inputToken ? pool.token1 : pool.token0;
        if (index === 0) {
          return {
            inputToken: outputToken,
            types: ["address", "uint24", "address"],
            path: [inputToken, pool.fee, outputToken],
          };
        } else {
          return {
            inputToken: outputToken,
            types: [...types, "uint24", "address"],
            path: [...path, pool.fee, outputToken],
          };
        }
      },
      { inputToken: input, path: [], types: [] },
    );
    return encodePacked(types, path);
  };

  private async getSolution(params: {
    src: Address;
    dst: Address;
    amount: string;
  }): Promise<UniswapV3Solution> {
    const src = isNativeToken(params.src) ? this.weth9Address : params.src;
    const dst = isNativeToken(params.dst) ? this.weth9Address : params.dst;

    const allPairs = this.getPairs(src, dst);

    const allPairAddress = flatten(
      allPairs.map(([token0, token1]) => {
        return [
          this.getPairAddress({ tokenA: token0, tokenB: token1, fee: 500 }),
          this.getPairAddress({ tokenA: token0, tokenB: token1, fee: 3000 }),
          this.getPairAddress({ tokenA: token0, tokenB: token1, fee: 10000 }),
        ];
      }),
    );

    const pairs = unionBy(allPairAddress, "address");

    const availablePairs = await this.getAvailablePairs(pairs);

    const result: UniswapV3Pair[][] = [];

    if (availablePairs.length === 0) {
      throw new Error("no path found");
    }

    this.searchOptimalPath({
      pools: availablePairs,
      tokenIn: src,
      tokenOut: dst,
      result,
    });

    const quoterContract = getContract({
      abi: QuoterABI,
      address: this.quoterAddress,
      client: this.client,
    });

    const data = await Promise.all(
      result.slice(0, 2).map((o) => {
        return Promise.all([
          o,
          quoterContract.read.quoteExactInput([
            this.encodeRouteToPath(o, src),
            BigInt(Number(params.amount)),
          ]),
        ]);
      }),
    );

    let max = data[0];
    for (let i = 0; i < data.length; i += 1) {
      const item = data[i];
      const [, [outputAmount]] = item;
      if (outputAmount > max[1][0]) {
        max = item;
      }
    }
    const [pools, [amountOut]] = max;

    return { amountOut: amountOut.toString(), pools, firstToken: src };
  }

  async getPrice(args: GetPriceArgs): Promise<GetPriceResponse> {
    const { src, dst, amount } = args;
    const { amountOut } = await this.getSolution({ src, dst, amount });
    return { dstAmount: amountOut };
  }

  async buildTransaction(
    args: BuildTransactionArgs,
  ): Promise<BuildTransactionResponse> {
    const { dst, src, amount, to, slippage = 1 } = args;
    const { pools, amountOut, firstToken } = await this.getSolution({
      dst,
      src,
      amount,
    });

    const amountOutMin = BigNumber(amountOut)
      .multipliedBy(100 - Number(slippage))
      .div(100)
      .toFixed(0);

    const latestBlock = await this.client.getBlock({ blockTag: "latest" });
    const deadline = latestBlock.timestamp + BigInt(60 * 60 * 1000);

    const path = this.encodeRouteToPath(pools, firstToken);
    const callbacks: Hex[] = [];

    const swapHex = encodeFunctionData({
      abi: SwapRouterABI,
      functionName: "exactInput",
      args: [
        {
          path,
          recipient: this.routerAddress,
          amountIn: BigInt(amount),
          amountOutMinimum: BigInt(1),
        },
      ],
    });

    callbacks.push(swapHex);

    if (isNativeToken(dst)) {
      callbacks.push(
        encodeFunctionData({
          abi: SwapRouterABI,
          functionName: "unwrapWETH9",
          args: [BigInt(amountOutMin), to],
        }),
      );
    } else {
      callbacks.push(
        encodeFunctionData({
          abi: SwapRouterABI,
          functionName: "sweepToken",
          args: [dst, BigInt(amountOutMin), to],
        }),
      );
    }

    const data = encodeFunctionData({
      abi: SwapRouterABI,
      functionName: "multicall",
      args: [callbacks],
    });

    return {
      tx: {
        data: data,
        to: this.routerAddress,
        value: isNativeToken(src) ? toHex(BigInt(amount)) : "0x0",
      },
      dstAmount: amountOut,
    };
  }
}
