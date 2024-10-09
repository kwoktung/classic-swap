import BigNumber from "bignumber.js";

import { Token } from "@/types/base";

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
