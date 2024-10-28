import { Chain } from "@/types/base";

const mainnet: Chain = {
  chainId: "1",
  name: "Ethereum",
  shortName: "ETH",
  explorer: {
    address: "https://etherscan.io/address/{address}",
    block: "https://etherscan.io/block/{block}",
    name: "https://etherscan.io/",
    transaction: "https://etherscan.io/tx/{transaction}",
  },
  weth9: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
};

const polygon: Chain = {
  chainId: "137",
  name: "Polygon",
  shortName: "Polygon",
  explorer: {
    address: "https://polygonscan.com/address/{address}",
    block: "https://polygonscan.com/block/{block}",
    name: "https://polygonscan.com/",
    transaction: "https://polygonscan.com/tx/{transaction}",
  },
  weth9: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
};

const arbitrum: Chain = {
  chainId: "42161",
  name: "Arbitrum",
  shortName: "arbitrum",
  explorer: {
    address: "https://arbiscan.io/address/{address}",
    block: "https://arbiscan.io/block/{block}",
    name: "https://arbiscan.io/",
    transaction: "https://arbiscan.io/tx/{transaction}",
  },
  weth9: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
};

const optimism: Chain = {
  chainId: "10",
  name: "Optimism",
  shortName: "optimism",
  explorer: {
    address: "https://optimistic.etherscan.io/address/{address}",
    block: "https://optimistic.etherscan.io/tx/{block}",
    name: "https://optimistic.etherscan.io/",
    transaction: "https://optimistic.etherscan.io/tx/{transaction}",
  },
  weth9: "0x4200000000000000000000000000000000000006",
};

const avalanche: Chain = {
  chainId: "43114",
  name: "Avalanche",
  shortName: "avalanche",
  explorer: {
    address: "https://cchain.explorer.avax.network/address/{address}",
    block: "https://cchain.explorer.avax.network/blocks/{block}",
    name: "https://cchain.explorer.avax.network/",
    transaction: "https://cchain.explorer.avax.network/tx/{transaction}",
  },
  weth9: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
};

export const chainList = [mainnet, polygon, arbitrum, optimism, avalanche];
