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
  chainId: string | number;
}) => {
  return `/explorer?format=${format}&value=${value}&chainId=${chainId}`;
};
