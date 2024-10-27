import { createPublicClient, http, PublicClient } from "viem";
import { polygon } from "viem/chains";

import { MixedLiquidityClient } from "@/client/liquidity/liquidity-client";
import { PriceClient } from "@/client/price";
import { TokenClient } from "@/client/token";

type ClientOptions = {
  chainId?: string;
};

class Factory {
  private createRpcClient() {
    return createPublicClient({
      chain: polygon,
      transport: http(process.env.POLYGON_RPC),
      batch: {
        multicall: true,
      },
      pollingInterval: 0,
    });
  }
  private rpcClients: Map<string, PublicClient> = new Map();

  getRpcClient(props?: { chainId?: string }): PublicClient {
    const { chainId = "137" } = props || {};
    if (this.rpcClients.has(chainId)) {
      return this.rpcClients.get(chainId) as PublicClient;
    }
    const client = this.createRpcClient();
    this.rpcClients.set(chainId, client);
    return client;
  }

  getTokenClient(props?: ClientOptions) {
    const rpcClient = this.getRpcClient(props);
    return new TokenClient({ client: rpcClient });
  }

  getPriceClient(props?: ClientOptions) {
    const rpcClient = this.getRpcClient(props);
    return new PriceClient({ client: rpcClient });
  }

  getLiquidityClient(props?: ClientOptions) {
    const rpcClient = this.getRpcClient(props);
    return new MixedLiquidityClient({
      client: rpcClient,
      weth9Address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    });
  }
}

const defaultFactory = new Factory();

export { defaultFactory as factory };
