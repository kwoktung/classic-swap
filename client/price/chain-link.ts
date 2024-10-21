import BigNumber from "bignumber.js";
import { chunk, flatten } from "lodash";
import { Address, PublicClient } from "viem";

import { PriceOracleABI } from "./price-oracle-abi";

export class ChainLinkClient {
  private client: PublicClient;
  private priceOracleAddress: Record<Address, Address>;
  constructor({ client }: { client: PublicClient }) {
    this.client = client;
    this.priceOracleAddress = {
      // native
      "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
        "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0",
      // uni
      "0xb33eaad8d922b1083446dc23f610c2567fb5180f":
        "0xdf0Fb4e4F928d2dCB76f438575fDD8682386e13C",
      //aave
      "0xd6df932a45c0f255f85145f286ea0b292b21c90b":
        "0x72484B12719E23115761D5DA1646945632979bB6",
    };
  }

  private getPriceOracleAddresses({
    tokenAddresses,
  }: {
    tokenAddresses: Address[];
  }) {
    return tokenAddresses.map((address) => ({
      tokenAddress: address,
      feedAddress: this.priceOracleAddress[address],
    }));
  }

  async getPrice({
    tokenAddresses,
  }: {
    tokenAddresses: Address[];
  }): Promise<Record<string, string>> {
    if (tokenAddresses.length === 0) {
      return {};
    }
    const feedAddresses = this.getPriceOracleAddresses({ tokenAddresses });
    const contracts = flatten(
      feedAddresses.map((item) => {
        return [
          {
            address: item.feedAddress,
            abi: PriceOracleABI,
            functionName: "latestAnswer",
          } as const,
          {
            address: item.feedAddress,
            abi: PriceOracleABI,
            functionName: "decimals",
          } as const,
        ];
      }),
    );

    const result = await this.client.multicall({
      contracts: contracts,
    });

    const list = chunk(result, 2);

    const resp: Record<string, string> = {};
    for (let i = 0; i < list.length; i += 1) {
      const [latestAnswerResp, decimalsResp] = list[i];
      if (
        latestAnswerResp.status === "success" &&
        decimalsResp.status === "success"
      ) {
        const latestAnswer = latestAnswerResp.result as bigint;
        const decimals = decimalsResp.result as number;
        const tokenAddress = feedAddresses[i].tokenAddress;
        const price = BigNumber(latestAnswer.toString())
          .shiftedBy(-decimals)
          .toFixed();

        resp[tokenAddress] = price;
      }
    }

    return resp;
  }

  getSupportTokens(): Set<string> {
    return new Set(Object.keys(this.priceOracleAddress));
  }
}
