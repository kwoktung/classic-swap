import BigNumber from "bignumber.js";

import { ChainExplorerConfig, Token } from "@/types/base";

export const formatNumber = ({
  value,
  decimalPlaces = 6,
}: {
  value?: string;
  decimalPlaces?: number;
}) => {
  if (!value) return "";
  return BigNumber(value).decimalPlaces(decimalPlaces).toFixed();
};

export const toReadableNumber = ({
  value,
  decimals,
}: {
  value: bigint | string;
  decimals: number;
}) => {
  return formatNumber({
    value: BigNumber(Number(value)).shiftedBy(-decimals).toFixed(),
    decimalPlaces: 6,
  });
};

export const formatExplorerUrl = ({
  value,
  format,
  chainId,
}: {
  value: string;
  format: keyof ChainExplorerConfig;
  chainId: string;
}) => {
  return `/explorer?format=${format}&value=${value}&chainId=${chainId}`;
};
