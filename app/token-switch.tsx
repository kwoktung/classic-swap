"use client";

import { ArrowDownIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

import { useDeriveState, useSwapActions } from "./context";

export const TokenSwitch = () => {
  const { switchTokens } = useSwapActions();
  const { loading } = useDeriveState();
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={switchTokens}
      disabled={loading}
    >
      <ArrowDownIcon className="h-4 w-4" />
    </Button>
  );
};
