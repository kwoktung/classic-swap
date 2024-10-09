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
};

export const chainList = [mainnet, polygon, arbitrum, optimism, avalanche];
