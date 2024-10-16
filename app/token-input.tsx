import BigNumber from "bignumber.js";
import { ChangeEvent, useCallback } from "react";

import { InteractiveInput } from "@/components/interactive-elements";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Token } from "@/types/base";

import { TokenSelector } from "./token-selector";

type TokenInputProps = {
  label: string;
  amount?: string;
  onAmountChange?: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  token?: Token;
  onTokenSelect?: (token: Token) => void;
  balance?: string;
  onMax?: () => void;
};

export const TokenInput = ({
  label,
  token,
  onTokenSelect,
  disabled,
  isLoading,
  amount,
  onAmountChange,
  balance,
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
        <div className="flex items-center py-2 space-x-2">
          <InteractiveInput
            className="bg-transparent border-none text-3xl w-full p-0 outline-none font-medium"
            value={amount}
            disabled={disabled}
            onChange={onChange}
          ></InteractiveInput>
          <TokenSelector token={token} onTokenSelect={onTokenSelect} />
        </div>
        <div className="flex flex-row justify-between">
          <div className="text-sm text-secondary-foreground">
            <span className="sr-only">$290,568.03</span>
          </div>
          <div>
            <small className="text-sm text-muted-foreground" onClick={onMax}>
              Balance:
              {balance
                ? formatNumber({ value: balance, decimalPlaces: 4 })
                : "0"}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};
