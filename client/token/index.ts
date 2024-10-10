import { Address, getContract, PublicClient } from "viem";
import { erc20Abi } from "viem";

import { isNativeToken, nativeAddress } from "@/lib/address";
import { Token } from "@/types/base";

export class TokenClient {
  private client: PublicClient;
  constructor(props: { client: PublicClient }) {
    this.client = props.client;
  }

  async getTokens(params: { addresses: Address[] }): Promise<Token[]> {
    const resp = await Promise.all(
      params.addresses.map((o) => {
        if (isNativeToken(o)) {
          return Promise.all([o, 18, "", ""]);
        } else {
          const erc20 = getContract({
            abi: erc20Abi,
            address: o,
            client: this.client,
          });
          return Promise.all([
            o,
            erc20.read.decimals(),
            erc20.read.name(),
            erc20.read.symbol(),
          ]);
        }
      }),
    );

    return resp.map(
      (o) =>
        ({ address: o[0], decimals: o[1], name: o[2], symbol: o[3] }) as Token,
    );
  }

  async getBalances(params: {
    tokenAddresses: Address[];
    accountAddress: Address;
  }): Promise<Record<string, string>> {
    const { tokenAddresses, accountAddress } = params;
    const addresses = tokenAddresses.filter((o) => !isNativeToken(o));

    const result = await this.client.multicall({
      contracts: addresses.map((_address) => {
        return {
          abi: erc20Abi,
          address: _address as Address,
          functionName: "balanceOf",
          args: [accountAddress],
        } as const;
      }),
    });

    const balances: Record<string, string> = {};
    for (let i = 0; i < addresses.length; i += 1) {
      const address = addresses[i];
      const data = result[i];
      if (data.status === "success") {
        balances[address.toLowerCase()] = data.result.toString();
      }
    }
    const ethBalance = await this.client.getBalance({
      address: accountAddress,
    });

    balances[nativeAddress] = ethBalance.toString();
    return balances;
  }
}
