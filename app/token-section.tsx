"use client";

import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useAccount, useBalance } from "wagmi";

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
    address: account.address,
    token:
      sellToken && !isNativeToken(sellToken.address)
        ? sellToken.address
        : undefined,
  });
  useEffect(() => {
    if (refreshKey > 0) {
      balance.refetch();
    }
  }, [refreshKey, balance]);
  return (
    <TokenInput
      label="Sell"
      token={sellToken}
      onTokenSelect={setSellToken}
      amount={amount}
      onAmountChange={setAmount}
      balance={
        balance.data
          ? toReadableNumber({
              value: balance.data.value,
              decimals: balance.data.decimals,
            })
          : undefined
      }
      onMax={() => balance.data && setAmount?.(balance.data?.formatted)}
    ></TokenInput>
  );
};

export const BuySection = () => {
  const refreshKey = useAtomValue(refreshKeyAtom);
  const { buyToken } = useSwapState();
  const { setBuyToken } = useSwapActions();
  const account = useAccount();
  const balance = useBalance({
    address: account.address,
    token:
      buyToken && !isNativeToken(buyToken.address)
        ? buyToken.address
        : undefined,
  });
  const { data, loading } = useDeriveState();
  useEffect(() => {
    if (refreshKey > 0) {
      balance.refetch();
    }
  }, [refreshKey, balance]);
  return (
    <TokenInput
      disabled
      isLoading={loading}
      label="Buy"
      token={buyToken}
      onTokenSelect={setBuyToken}
      balance={
        balance.data
          ? toReadableNumber({
              value: balance.data.value,
              decimals: balance.data.decimals,
            })
          : undefined
      }
      amount={data?.buyAmount}
    ></TokenInput>
  );
};
