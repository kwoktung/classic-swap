"use client";

import { PrimitiveAtom, useAtom } from "jotai";
import { splitAtom } from "jotai/utils";
import { useEffect } from "react";
import { Hash } from "viem";
import { usePublicClient } from "wagmi";

import { Button } from "@/components/ui/button";
import { pendingHistoryListAtom } from "@/state/atom";
import { HistoryItem } from "@/types/history";

const HistoryObserve = ({ txAtom }: { txAtom: PrimitiveAtom<HistoryItem> }) => {
  const client = usePublicClient();
  const [tx, setTx] = useAtom(txAtom);
  useEffect(() => {
    if (!client) {
      return;
    }
    const timer = setInterval(async () => {
      const receipt = await client.getTransactionReceipt({
        hash: tx.txHash as Hash,
      });
      if (receipt) {
        setTx({
          ...tx,
          txHash: tx.txHash,
          status: receipt.status === "success" ? "success" : "failed",
        });
      }
    }, 10 * 1000);
    return () => clearInterval(timer);
  }, [client, tx, setTx]);
  return null;
};

export const HistoryIndicator = () => {
  // TODO: https://jotai.org/docs/recipes/large-objects
  const [txsAtom] = useAtom(splitAtom(pendingHistoryListAtom));
  return (
    <>
      <Button>{txsAtom.length} pending tx</Button>
      {txsAtom.map((atom) => (
        <HistoryObserve key={atom.toString()} txAtom={atom}></HistoryObserve>
      ))}
    </>
  );
};
