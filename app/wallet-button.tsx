"use client";

import { useAtomValue } from "jotai";
import Link from "next/link";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { polygon } from "wagmi/chains";

import { Button } from "@/components/ui/button";
import { formatExplorerUrl } from "@/lib/format";
import { pendingHistoryListAtom } from "@/state/atom";

import { HistoryIndicator } from "./history-indicator";

export const WalletConnect = () => {
  const account = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const pendingTxs = useAtomValue(pendingHistoryListAtom);

  if (account.status === "disconnected") {
    return (
      <Button
        variant={"outline"}
        size="lg"
        onClick={() => connect({ connector: connectors[0] })}
      >
        Connect Wallet
      </Button>
    );
  } else if (
    account.status === "connecting" ||
    account.status === "reconnecting"
  ) {
    return (
      <Button variant={"outline"} size="lg" disabled>
        Connecting
      </Button>
    );
  }

  if (!account.chain) {
    return (
      <Button
        variant={"outline"}
        size="lg"
        onClick={() => switchChain({ chainId: polygon.id })}
      >
        Not support
      </Button>
    );
  }

  if (pendingTxs.length) {
    return <HistoryIndicator />;
  }

  return (
    <Link
      href={formatExplorerUrl({
        value: account.address,
        format: "address",
        chainId: String(account.chainId),
      })}
      target="_blank"
    >
      <Button
        variant={"ghost"}
      >{`${account.address.slice(0, 6)}...${account.address.slice(-6)}`}</Button>
    </Link>
  );
};
