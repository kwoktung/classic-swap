"use client";

import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { polygon } from "wagmi/chains";

import { Button } from "@/components/ui/button";

export const WalletConnect = () => {
  const account = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();

  if (account.status === "connected") {
    if (!account.chain) {
      return (
        <Button
          variant={"outline"}
          size="lg"
          onClick={() => switchChain({ chainId: polygon.id })}
        >
          not support
        </Button>
      );
    }
    return (
      <Button
        variant={"ghost"}
      >{`${account.address.slice(0, 6)}...${account.address.slice(-6)}`}</Button>
    );
  }
  return (
    <Button
      variant={"outline"}
      size="lg"
      onClick={() => connect({ connector: connectors[0] })}
    >
      Connect Wallet
    </Button>
  );
};
