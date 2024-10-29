"use client";

import BigNumber from "bignumber.js";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";

import { useTokenPrice } from "@/hooks/use-token-price";
import { isNativeToken } from "@/lib/address";
import { toReadableNumber } from "@/lib/format";
import { refreshKeyAtom } from "@/state/atom";

import { useDeriveState, useSwapActions, useSwapState } from "./context";
import { TokenInput } from "./token-input";

export const SellSection = () => {
  const refreshKey = useAtomValue(refreshKeyAtom);
  const { sellToken, amount } = useSwapState();
  const { setSellToken, setAmount } = useSwapActions();
  const account = useAccount();
  const balance = useBalance({
    scopeKey: String(refreshKey),
    address: account.address,
    token: isNativeToken(sellToken?.address) ? undefined : sellToken?.address,
  });

  const balanceParsed = useMemo(() => {
    return balance.data
      ? toReadableNumber({
          value: balance.data.value,
          decimals: balance.data.decimals,
        })
      : undefined;
  }, [balance.data]);

  const priceResp = useTokenPrice({
    enabled: sellToken !== undefined,
    tokenAddresses: sellToken ? [sellToken.address] : [],
  });

  const priceParsed = useMemo(() => {
    if (sellToken && priceResp.data?.[sellToken.address] && amount) {
      return BigNumber(priceResp.data[sellToken.address])
        .multipliedBy(amount)
        .toFixed();
    }
    return;
  }, [sellToken, priceResp, amount]);

  return (
    <TokenInput
      label="Sell"
      token={sellToken}
      onTokenSelect={setSellToken}
      amount={amount}
      onAmountChange={setAmount}
      balance={balanceParsed}
      onMax={balanceParsed ? () => setAmount?.(balanceParsed) : undefined}
      price={priceParsed}
    ></TokenInput>
  );
};

export const BuySection = () => {
  const refreshKey = useAtomValue(refreshKeyAtom);
  const { buyToken } = useSwapState();
  const { setBuyToken } = useSwapActions();
  const { data, loading } = useDeriveState();
  const account = useAccount();
  const balance = useBalance({
    scopeKey: String(refreshKey),
    address: account.address,
    token: isNativeToken(buyToken?.address) ? undefined : buyToken?.address,
  });

  const balanceParsed = useMemo(() => {
    return balance.data
      ? toReadableNumber({
          value: balance.data.value,
          decimals: balance.data.decimals,
        })
      : undefined;
  }, [balance.data]);

  const priceResp = useTokenPrice({
    enabled: buyToken !== undefined,
    tokenAddresses: buyToken ? [buyToken.address] : [],
  });

  const priceParsed = useMemo(() => {
    if (buyToken && priceResp.data?.[buyToken.address] && data?.buyAmount) {
      return BigNumber(priceResp.data[buyToken.address])
        .multipliedBy(data?.buyAmount)
        .toFixed();
    }
    return;
  }, [buyToken, priceResp, data?.buyAmount]);

  return (
    <TokenInput
      label="Buy"
      disabled
      isLoading={loading}
      token={buyToken}
      onTokenSelect={setBuyToken}
      balance={balanceParsed}
      price={priceParsed}
      amount={data?.buyAmount}
    ></TokenInput>
  );
};
