import { chunk } from "lodash";
import { Address } from "viem";

import { httpClient } from "@/client/http";

export class GeckoTerminalClient {
  private async getPriceFromGeckoTerminalAPI(
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

  async getPrice({
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
        this.getPriceFromGeckoTerminalAPI(items),
      ),
    );
    const prices = priceList.reduce(
      (a, b) => ({ ...a, ...b }),
      {} as Record<string, string>,
    );
    return prices;
  }
}
