"use client";

import { ArrowDownIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";

import { useSwapActions } from "./context";

export const SwitchTokens = () => {
  const { switchTokens } = useSwapActions();
  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      onClick={switchTokens}
    >
      <ArrowDownIcon className="h-4 w-4" />
    </Button>
  );
};
