"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import BigNumber from "bignumber.js";
import { useCallback, useMemo } from "react";
import { useAccount, useBalance, useConnect } from "wagmi";

import { Button } from "@/components/ui/button";
import { isNativeToken } from "@/lib/address";

import { useDeriveState, useSwapState } from "./context";
import { useSwapCallback } from "./use-swap";

const QuoteErrorButton = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <Button size="lg" onClick={onRetry}>
      Retry
    </Button>
  );
};

const QuoteLoadingButton = () => {
  return (
    <Button size="lg" disabled>
      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
    </Button>
  );
};

const QuoteMuteButton = () => {
  return (
    <Button size="lg" disabled>
      Swap
    </Button>
  );
};

const InsufficientBalanceButton = () => {
  const { sellToken } = useSwapState();
  return (
    <Button size="lg" disabled>
      {`Insufficient ${sellToken?.symbol.toUpperCase()} balance`}
    </Button>
  );
};

const SubmitButton = ({ buttonText = "Swap" }: { buttonText?: string }) => {
  const { sellToken, amount, buyToken } = useSwapState();
  const { handleSwap, statusText } = useSwapCallback();
  const onSwap = useCallback(() => {
    if (sellToken && buyToken && amount) {
      handleSwap({ sellToken, buyToken, amount });
    }
  }, [handleSwap, sellToken, buyToken, amount]);
  return (
    <Button size="lg" onClick={onSwap} disabled={!!statusText}>
      {statusText ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
      {statusText || buttonText}
    </Button>
  );
};

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
      // Number(1013483144237488630) = 1013483144237488600
      return BigNumber(amount)
        .shiftedBy(sellToken.decimals)
        .gt(balance.data.value.toString());
    }
  }, [balance, amount, sellToken]);

  if (deriveState.isFetching) {
    return <QuoteLoadingButton />;
  }

  if (deriveState.error) {
    return <QuoteErrorButton onRetry={() => deriveState.refetch()} />;
  }

  if (!deriveState.data?.buyAmount) {
    return <QuoteMuteButton />;
  }

  if (isInsufficientBalance) {
    return <InsufficientBalanceButton />;
  }

  let buttonText: string | undefined;
  if (deriveState.data.strategy === "WETH9") {
    buttonText = isNativeToken(sellToken?.address) ? "Wrap" : "Unwrap";
  }

  return <SubmitButton buttonText={buttonText} />;
};

export const MainButton = () => {
  const account = useAccount();
  const { connect, connectors } = useConnect();
  if (!account.isConnected) {
    return (
      <Button
        className="lg"
        onClick={() => connect({ connector: connectors[0] })}
      >
        Connect Wallet
      </Button>
    );
  } else if (!account.chain) {
    return (
      <Button disabled size="lg">
        Not Support Chain
      </Button>
    );
  }
  return <SwapStateButton />;
};
