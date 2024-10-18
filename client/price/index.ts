import BigNumber from "bignumber.js";
import { chunk, flatten } from "lodash";
import { Address, PublicClient } from "viem";

import { httpClient } from "@/client/http";

import { PriceOracleABI } from "./abi";

export class PriceClient {
  private client: PublicClient;
  private chainLinkMap: Record<Address, Address>;
  constructor({ client }: { client: PublicClient }) {
    this.client = client;
    this.chainLinkMap = {
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

  private getFeedAddresses({ tokenAddresses }: { tokenAddresses: Address[] }) {
    return tokenAddresses.map((address) => ({
      tokenAddress: address,
      feedAddress: this.chainLinkMap[address],
    }));
  }

  private async getPriceFromChainLinkFeed({
    tokenAddresses,
  }: {
    tokenAddresses: Address[];
  }): Promise<Record<string, string>> {
    if (tokenAddresses.length === 0) {
      return {};
    }
    const feedAddresses = this.getFeedAddresses({ tokenAddresses });
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

  private async getPriceFromGeckoTerminalAPI_(
    tokenAddresses: string[],
  ): Promise<Record<string, string>> {
    const addresses = tokenAddresses.join(",");
    const network = "polygon_pos";
    const url = `https://api.geckoterminal.com/api/v2/simple/networks/${network}/token_price/${addresses}`;
    const httpResp = await httpClient.get<{
      data: {
        id: string;
        type: string;
        attributes: { token_prices: Record<string, string> };
      };
    }>(url);
    return httpResp.data.data.attributes.token_prices;
  }

  private async getPriceFromGeckoTerminalAPI({
    tokenAddresses,
  }: {
    tokenAddresses: Address[];
  }): Promise<Record<string, string>> {
    if (tokenAddresses.length === 0) {
      return {};
    }
    const tokenAddressChuck = chunk(tokenAddresses, 30);
    const priceList = await Promise.all(
      tokenAddressChuck.map((items) =>
        this.getPriceFromGeckoTerminalAPI_(items),
      ),
    );
    const prices = priceList.reduce(
      (a, b) => ({ ...a, ...b }),
      {} as Record<string, string>,
    );
    return prices;
  }

  async getPrice({ tokenAddresses }: { tokenAddresses: Address[] }) {
    const chainLinkTokens = tokenAddresses.filter(
      (tokenAddress) => this.chainLinkMap[tokenAddress],
    );
    const restTokens = tokenAddresses.filter(
      (tokenAddress) => !this.chainLinkMap[tokenAddress],
    );

    const chainLinkResp = await this.getPriceFromChainLinkFeed({
      tokenAddresses: chainLinkTokens,
    });
    const geckoTerminalResp = await this.getPriceFromGeckoTerminalAPI({
      tokenAddresses: restTokens,
    });
    return { ...chainLinkResp, ...geckoTerminalResp };
  }
}
