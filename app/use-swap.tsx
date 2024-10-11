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
      const formattedSellAmount = BigNumber(amount)
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
        if (new BigNumber(Number(balanceOf)).lt(formattedSellAmount)) {
          return;
        }
        const resp = await httpClient.get<{
          tx: EVMTransaction;
        }>("/api/swap", {
          params: {
            to: wallet.data.account.address,
            src: swapState.sellToken.address,
            dst: swapState.buyToken.address,
            amount: formattedSellAmount,
          },
        });
        if (resp.data.tx.to && !isNativeToken(swapState.sellToken.address)) {
          setStatusText("Check Approve");
          const allowanceValue = await erc20Contract.read.allowance([
            wallet.data.account.address,
            resp.data.tx.to,
          ]);
          if (new BigNumber(Number(allowanceValue)).lt(formattedSellAmount)) {
            setStatusText("Approve");
            const approveHash = await wallet.data.sendTransaction({
              to: swapState.sellToken.address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [resp.data.tx.to, BigInt(formattedSellAmount)],
              }),
            });

            await client.waitForTransactionReceipt({
              hash: approveHash,
            });
          }
        }
        setStatusText("Swap");
        const txhash = await wallet.data.sendTransaction({
          to: resp.data.tx.to,
          value: BigInt(Number(resp.data.tx.value)),
          data: resp.data.tx.data,
        });
        const historyItem: HistoryItem = {
          fromToken: sellToken,
          fromAmount: amount,
          toToken: buyToken,
          // TODO: FIXME
          toAmount: "0",
          txHash: txhash,
          status: "pending",
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
                  value: txhash,
                  format: "transaction",
                  chainId: "137",
                })}
              >
                View
              </Link>
            </ToastAction>
          ),
        });
        return txhash;
      } finally {
        setStatusText(undefined);
      }
    },
    [client, wallet, toast, clear, addHistoryItem],
  );
  return { handleSwap, statusText };
};
