"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { PrimitiveAtom, useAtom } from "jotai";
import { splitAtom } from "jotai/utils";
import { useEffect } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { usePublicClient } from "wagmi";

import { Button } from "@/components/ui/button";
import { pendingHistoryListAtom, refreshKeyAtom } from "@/state/atom";
import { HistoryItem } from "@/types/history";

const HistoryObserve = ({ txAtom }: { txAtom: PrimitiveAtom<HistoryItem> }) => {
  const client = usePublicClient();
  const [tx, setTx] = useAtom(txAtom);
  useEffect(() => {
    if (!client) {
      return;
    }
    const timer = setInterval(async () => {
      let receipt: TransactionReceipt | undefined;
      try {
        receipt = await client.getTransactionReceipt({
          hash: tx.txHash as Hash,
        });
      } catch {
        console.error("failed to find out receipt");
        return;
      }
      if (receipt) {
        setTx({
          ...tx,
          status: receipt.status === "success" ? "success" : "failed",
        });
      } else {
        const now = Date.now();
        if (now - tx.createAt > 1000 * 60 * 60 * 24) {
          setTx({ ...tx, status: "failed" });
        }
      }
    }, 10 * 1000);
    return () => clearInterval(timer);
  }, [client, tx, setTx]);
  return null;
};

export const HistoryIndicator = () => {
  // https://jotai.org/docs/recipes/large-objects
  const [txsAtom] = useAtom(splitAtom(pendingHistoryListAtom));
  const [, setRefreshKey] = useAtom(refreshKeyAtom);
  useEffect(() => {
    // fix me: refresh when txs length changed
    return () => setRefreshKey(Date.now());
  }, [setRefreshKey]);
  return (
    <>
      <Button>
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        <span>{txsAtom.length} pending</span>
      </Button>
      {txsAtom.map((atom) => (
        <HistoryObserve key={atom.toString()} txAtom={atom}></HistoryObserve>
      ))}
    </>
  );
};
