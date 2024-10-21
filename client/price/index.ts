import { kv } from "@vercel/kv";
import { Address, PublicClient } from "viem";

import { ChainLinkClient } from "./chain-link";
import { GeckoTerminalClient } from "./gecko-terminal";

export class PriceClient {
  private chainLinkClient: ChainLinkClient;
  private geckoTerminalClient: GeckoTerminalClient;
  constructor({ client }: { client: PublicClient }) {
    this.chainLinkClient = new ChainLinkClient({ client });
    this.geckoTerminalClient = new GeckoTerminalClient();
  }

  async getPrice({ tokenAddresses }: { tokenAddresses: Address[] }) {
    const cachedResults = await Promise.all(
      tokenAddresses.map(async (address) => {
        const cacheKey = `price:${address}`;
        return { address, cachedPrice: await kv.get<string>(cacheKey) };
      }),
    );

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
      await Promise.all(
        Object.entries(freshPrices).map(([address, price]) =>
          kv.set(`price:${address}`, price, { ex: 60 * 5 }),
        ),
      );
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
