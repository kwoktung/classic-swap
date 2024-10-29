import BigNumber from "bignumber.js";
import { ChangeEvent, useCallback } from "react";

import { InteractiveInput } from "@/components/interactive-elements";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Token } from "@/types/base";

import { TokenSelector } from "./token-selector";

type TokenInputProps = {
  label: string;
  amount?: string;
  disabled?: boolean;
  isLoading?: boolean;
  token?: Token;
  balance?: string;
  price?: string;

  onAmountChange?: (value: string) => void;
  onTokenSelect?: (token: Token) => void;
  onMax?: () => void;
};

export const TokenInput = ({
  label,
  token,
  disabled,
  isLoading,
  balance,
  price,
  amount = "",

  onTokenSelect,
  onAmountChange,
  onMax,
}: TokenInputProps) => {
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value === "" || !BigNumber(value).isNaN()) {
        onAmountChange?.(value);
      }
    },
    [onAmountChange],
  );
  return (
    <div className={cn("relative", isLoading ? "opacity-80" : "opacity-100")}>
      {isLoading ? <div className="absolute w-full h-full"></div> : null}
      <div
        className={cn(
          "rounded-lg p-4",
          disabled
            ? "bg-muted/60"
            : "border border-accent transition duration-700 focus-within:border-primary/50",
        )}
      >
        <div className="flex flex-row justify-between">
          <span className="text-sm text-secondary-foreground">{label}</span>
        </div>
        <div className="flex items-center py-2 space-x-2 justify-between">
          <div className="lg:w-[300px] sm:w-full">
            {isLoading ? (
              <Skeleton className="h-9 w-[100px]"></Skeleton>
            ) : (
              <InteractiveInput
                className="bg-transparent border-none text-3xl p-0 outline-none font-medium w-full"
                value={amount}
                disabled={disabled}
                onChange={onChange}
              ></InteractiveInput>
            )}
          </div>
          <TokenSelector token={token} onSelect={onTokenSelect} />
        </div>
        <div className="flex flex-row items-center justify-between">
          <small className="text-sm text-muted-foreground">
            {price
              ? `$${formatNumber({ value: price, decimalPlaces: 4 })}`
              : null}
          </small>
          <small className="text-sm text-muted-foreground" onClick={onMax}>
            Balance:
            {balance ? formatNumber({ value: balance, decimalPlaces: 4 }) : "0"}
          </small>
        </div>
      </div>
    </div>
  );
};
