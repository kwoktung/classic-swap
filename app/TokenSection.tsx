"use client";

import { useAccount, useBalance } from "wagmi";

import { isNativeToken } from "@/lib/address";

import { useDeriveState, useSwapActions, useSwapState } from "./context";
import { TokenInput } from "./TokenInput";

export const SellSection = () => {
  const { sellToken, amount } = useSwapState();
  const { setSellToken, setAmount } = useSwapActions();
  const account = useAccount();
  const balanceResult = useBalance({
    address: account.address,
    token:
      sellToken && !isNativeToken(sellToken.address)
        ? sellToken.address
        : undefined,
  });
  return (
    <TokenInput
      label="SELL"
      token={sellToken}
      onTokenSelect={setSellToken}
      amount={amount}
      onAmountChange={setAmount}
      balance={balanceResult.data?.formatted}
      onMax={() =>
        balanceResult.data && setAmount?.(balanceResult.data?.formatted)
      }
    ></TokenInput>
  );
};

export const BuySection = () => {
  const { buyToken } = useSwapState();
  const { setBuyToken } = useSwapActions();
  const { data, loading } = useDeriveState();
  return (
    <TokenInput
      disabled
      isLoading={loading}
      label="BUY"
      token={buyToken}
      onTokenSelect={setBuyToken}
      amount={data?.buyAmount}
    ></TokenInput>
  );
};
