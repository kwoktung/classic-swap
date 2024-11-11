import BigNumber from "bignumber.js";

import { ChainExplorerConfig, Token } from "@/types/base";

export const formatNumber = ({
  value,
  decimalPlaces = 6,
  roundingMode = BigNumber.ROUND_DOWN,
}: {
  value?: string;
  decimalPlaces?: number;
  roundingMode?: BigNumber.RoundingMode;
}) => {
  if (!value) return "";
  return BigNumber(value).toFixed(decimalPlaces, roundingMode);
};

export const toReadableNumber = ({
  value,
  decimals,
  decimalPlaces,
}: {
  value: bigint | string;
  decimals: number;
  decimalPlaces?: number;
}) => {
  return formatNumber({
    value: BigNumber(value.toString()).shiftedBy(-decimals).toFixed(),
    decimalPlaces,
  });
};

export const formatExplorerUrl = ({
  value,
  format,
  chainId,
}: {
  value: string;
  format: keyof ChainExplorerConfig;
  chainId: string | number;
}) => {
  return `/explorer?format=${format}&value=${value}&chainId=${chainId}`;
};
