import BigNumber from "bignumber.js";

export const formatBalance = (value?: string) => {
  if (!value) return "";
  return BigNumber(value).decimalPlaces(6).toFixed();
};
