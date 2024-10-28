import Redis from "ioredis";
import { Address, PublicClient } from "viem";

import { ChainLinkClient } from "./chain-link";
import { GeckoTerminalClient } from "./gecko-terminal";

export class PriceClient {
  private chainLinkClient: ChainLinkClient;
  private geckoTerminalClient: GeckoTerminalClient;
  private kv: Redis;
  constructor({ client, kv }: { client: PublicClient; kv: Redis }) {
    this.chainLinkClient = new ChainLinkClient({ client });
    this.geckoTerminalClient = new GeckoTerminalClient();
    this.kv = kv;
  }

  async getPrice({ tokenAddresses }: { tokenAddresses: Address[] }) {
    const cachedResp = await this.kv.mget(
      tokenAddresses.map((address) => `price:${address}`),
    );

    const cachedResults = tokenAddresses.map((address, i) => {
      return { address, cachedPrice: cachedResp[i] };
    });

    const uncachedAddresses = cachedResults
      .filter(({ cachedPrice }) => !cachedPrice)
      .map(({ address }) => address);

    let freshPrices: Record<string, string> = {};
    if (uncachedAddresses.length > 0) {
      const tokenSet = this.chainLinkClient.getSupportTokens();
      const chainLinkTokens = uncachedAddresses.filter((tokenAddress) =>
        tokenSet.has(tokenAddress),
      );
      const restTokens = uncachedAddresses.filter(
        (tokenAddress) => !tokenSet.has(tokenAddress),
      );

      const chainLinkResp = await this.chainLinkClient.getPrice({
        tokenAddresses: chainLinkTokens,
      });
      const geckoTerminalResp = await this.geckoTerminalClient.getPrice({
        tokenAddresses: restTokens,
      });

      freshPrices = { ...chainLinkResp, ...geckoTerminalResp };

      // Cache new results individually with a TTL of 1 minute (60 seconds)
      const pipeline = this.kv.pipeline();
      Object.entries(freshPrices).map(([address, price]) =>
        pipeline.set(`price:${address}`, price, "EX", 60 * 5),
      );
      await pipeline.exec();
    }

    return Object.fromEntries(
      tokenAddresses.map((address) => [
        address,
        cachedResults.find((result) => result.address === address)
          ?.cachedPrice || freshPrices[address],
      ]),
    );
  }
}
