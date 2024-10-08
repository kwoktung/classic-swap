"use client";
import { ReloadIcon } from "@radix-ui/react-icons";
import BigNumber from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useAccount, useBalance } from "wagmi";

import { Button } from "@/components/ui/button";
import { isNativeToken } from "@/lib/address";

import { useDeriveState, useSwapState } from "./context";
import { useSwapCallback } from "./use-swap";

const SwapStateButton = () => {
  const account = useAccount();
  const { sellToken, amount } = useSwapState();
  const deriveState = useDeriveState();

  const balance = useBalance({
    address: account.address,
    token:
      sellToken && sellToken?.address && !isNativeToken(sellToken.address)
        ? sellToken.address
        : undefined,
  });

  const isInsufficientBalance = useMemo(() => {
    if (balance.status === "success" && amount && sellToken) {
      return BigNumber(amount)
        .shiftedBy(sellToken.decimals)
        .gt(Number(balance.data.value));
    }
  }, [balance, amount, sellToken]);

  let buttonText: string = "Swap";

  if (isInsufficientBalance) {
    buttonText = `Insufficient ${sellToken?.symbol.toUpperCase()} balance`;
  }

  const isNotDstAmount = !deriveState.data?.buyAmount;

  if (
    !deriveState ||
    deriveState.loading ||
    isNotDstAmount ||
    isInsufficientBalance
  ) {
    return (
      <Button size={"lg"} disabled>
        {deriveState.loading ? (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
    );
  }

  return <SubmitButton />;
};

const SubmitButton = () => {
  const { sellToken, amount, buyToken } = useSwapState();
  const { handleSwap, statusText } = useSwapCallback();
  const onSwap = useCallback(() => {
    if (sellToken && buyToken && amount) {
      handleSwap({ sellToken, buyToken, amount });
    }
  }, [handleSwap, sellToken, buyToken, amount]);
  return (
    <Button size="lg" onClick={onSwap}>
      {statusText ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
      {statusText || "Swap"}
    </Button>
  );
};

export const MainButton = () => {
  const account = useAccount();
  if (!account) {
    return <Button className="lg">Not Connected</Button>;
  }
  if (!account.chain) {
    return (
      <Button disabled size="lg">
        Not Support Chain
      </Button>
    );
  }
  return <SwapStateButton />;
};
