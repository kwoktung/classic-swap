"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useAccount } from "wagmi";

import { InteractiveDiv } from "@/components/interactive-elements";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { httpClient } from "@/lib/client";
import { formatBalance } from "@/lib/format";
import { APIBalanceResponse, APITokensResponse } from "@/types/apis";
import { Token } from "@/types/base";

const TokenList = ({
  onTokenSelect,
}: {
  onTokenSelect?: (token: Token) => void;
}) => {
  const account = useAccount();
  const result = useQuery({
    queryKey: ["token_list", account.address],
    queryFn: async () => {
      const resp = await httpClient.get<APITokensResponse>("/api/token", {
        params: { accountAddress: account.address },
      });
      const { assets } = resp.data;
      return assets;
    },
  });

  const { data: balancesMap } = useQuery({
    enabled: Boolean(result.data?.length && result.data?.length > 0),
    queryKey: ["token_balance", account.address],
    queryFn: async () => {
      const resp = await httpClient.get<APIBalanceResponse>("/api/balance", {
        params: {
          accountAddress: account.address,
          tokenAddresses: result.data?.map((o) => o.address).join(","),
        },
      });
      const { balances } = resp.data;
      return balances;
    },
  });

  if (result.isLoading) {
    return <div className="">Loading</div>;
  }
  if (!result.data || result.data.length === 0) {
    return null;
  }
  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto">
      {result.data.map((item) => (
        <InteractiveDiv key={item.symbol} onClick={() => onTokenSelect?.(item)}>
          <div className="flex items-center justify-between p-4 bg-accent rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  className="w-full h-full rounded-full"
                  src={item.logoURI ?? ""}
                  alt={item.name}
                />
              </div>
              <div>
                <h3 className="font-semibold text-accent-foreground">
                  {item.name}
                </h3>
                <p className="text-sm text-accent-foreground">{item.symbol}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-accent-foreground">
              {formatBalance(balancesMap?.[item.address])}
            </span>
          </div>
        </InteractiveDiv>
      ))}
    </div>
  );
};

type TokenSelectorProps = {
  token?: Token;
  onTokenSelect?: (token: Token) => void;
};

export function TokenSelector({ token, onTokenSelect }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onPress = useCallback(
    (token: Token) => {
      onTokenSelect?.(token);
      setIsOpen(false);
    },
    [onTokenSelect],
  );
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {token ? (
          <Button variant="outline" className="rounded-full">
            {token.symbol}
          </Button>
        ) : (
          <Button variant="outline" className="rounded-full">
            Select Token
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tokens</DialogTitle>
        </DialogHeader>
        <TokenList onTokenSelect={onPress} />
      </DialogContent>
    </Dialog>
  );
}
