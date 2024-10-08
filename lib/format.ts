import BigNumber from "bignumber.js";

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
