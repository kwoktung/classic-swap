"use client";

import BigNumber from "bignumber.js";
import { useSetAtom } from "jotai";
import Link from "next/link";
import { useCallback, useState } from "react";
import { encodeFunctionData, erc20Abi, getContract } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";

import { httpClient } from "@/client/http";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { isNativeToken } from "@/lib/address";
import { formatExplorerUrl } from "@/lib/format";
import { addHistoryAtom } from "@/state/atom";
import type { APISwapResponse } from "@/types/apis";
import { EVMTransaction, Token } from "@/types/base";
import { HistoryItem } from "@/types/history";

import { useSwapActions } from "./context";

type StatusText =
  | "Check Balance"
  | "Check Approve"
  | "Approve"
  | "Swap"
  | undefined;

export const useSwapCallback = () => {
  const [statusText, setStatusText] = useState<StatusText>();
  const wallet = useWalletClient();
  const client = usePublicClient();
  const { clear } = useSwapActions();
  const { toast } = useToast();
  const addHistoryItem = useSetAtom(addHistoryAtom);

  const handleSwap = useCallback(
    async (swapState: {
      sellToken: Token;
      buyToken: Token;
      amount: string;
    }) => {
      if (!swapState || !wallet.data || !client) {
        return;
      }
      const { sellToken, buyToken, amount } = swapState;
      const sellAmount = BigNumber(amount)
        .shiftedBy(sellToken.decimals)
        .toFixed(0);
      try {
        const erc20Contract = getContract({
          address: sellToken.address,
          abi: erc20Abi,
          client,
        });
        setStatusText("Check Balance");
        let balanceOf = BigInt(0);
        if (isNativeToken(sellToken.address)) {
          balanceOf = await client.getBalance({
            address: wallet.data.account.address,
          });
        } else {
          balanceOf = await erc20Contract.read.balanceOf([
            wallet.data.account.address,
          ]);
        }
        if (new BigNumber(balanceOf.toString()).lt(sellAmount)) {
          return;
        }
        const resp = await httpClient.get<APISwapResponse>("/api/swap", {
          params: {
            to: wallet.data.account.address,
            src: sellToken.address,
            dst: buyToken.address,
            amount: sellAmount,
          },
        });
        const { tx, type, amountOut } = resp.data;
        if (tx.to && type == "swap" && !isNativeToken(sellToken.address)) {
          setStatusText("Check Approve");
          const allowanceValue = await erc20Contract.read.allowance([
            wallet.data.account.address,
            tx.to,
          ]);
          if (new BigNumber(allowanceValue.toString()).lt(sellAmount)) {
            setStatusText("Approve");
            const approveHash = await wallet.data.sendTransaction({
              to: sellToken.address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [tx.to, BigInt(sellAmount)],
              }),
            });

            await client.waitForTransactionReceipt({
              hash: approveHash,
            });
          }
        }
        setStatusText("Swap");
        const txHash = await wallet.data.sendTransaction({
          to: tx.to,
          value: BigInt(BigNumber(tx.value).toString()),
          data: tx.data,
        });
        const historyItem: HistoryItem = {
          fromToken: sellToken,
          fromAmount: amount,
          toToken: buyToken,
          toAmount: BigNumber(amountOut)
            .shiftedBy(-buyToken.decimals)
            .toFixed(),
          txHash,
          status: "pending",
          createAt: Date.now(),
        };
        addHistoryItem(historyItem);
        clear?.();
        toast({
          title: "Transaction has been submitted",
          action: (
            <ToastAction altText="view transaction" asChild>
              <Link
                target="_blank"
                href={formatExplorerUrl({
                  value: txHash,
                  format: "transaction",
                  chainId: "137",
                })}
              >
                View
              </Link>
            </ToastAction>
          ),
        });
        return txHash;
      } finally {
        setStatusText(undefined);
      }
    },
    [client, wallet, toast, clear, addHistoryItem],
  );
  return { handleSwap, statusText };
};
