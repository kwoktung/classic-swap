"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { PrimitiveAtom, useAtom } from "jotai";
import { splitAtom } from "jotai/utils";
import { useEffect } from "react";
import type { Hash, TransactionReceipt } from "viem";
import { usePublicClient } from "wagmi";
import { getBalanceQueryKey } from "wagmi/query";

import { Button } from "@/components/ui/button";
import { isNativeToken } from "@/lib/address";
import { queryClient } from "@/lib/query-client";
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
        queryClient.invalidateQueries({
          queryKey: getBalanceQueryKey({
            address: tx.address,
            token: isNativeToken(tx.fromToken.address)
              ? undefined
              : tx.fromToken.address,
            chainId: tx.chainId,
          }),
        });
        queryClient.invalidateQueries({
          queryKey: getBalanceQueryKey({
            address: tx.address,
            chainId: tx.chainId,
            token: isNativeToken(tx.toToken.address)
              ? undefined
              : tx.toToken.address,
          }),
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
  const [txsAtom] = useAtom(splitAtom(pendingHistoryListAtom));
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
