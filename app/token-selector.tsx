"use client";

import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { useCallback, useMemo, useState } from "react";
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
import { formatNumber } from "@/lib/format";
import {
  APIBalanceResponse,
  APIPriceResponse,
  APITokensResponse,
} from "@/types/apis";
import { Token } from "@/types/base";

type TokenListItemProps = {
  token: Token;
  amount?: string;
  price?: string;
};

const TokenListItem = ({ token, amount, price }: TokenListItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 bg-accent rounded-lg shadow">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img
            className="w-full h-full rounded-full"
            src={token.logoURI ?? ""}
            alt={token.logoURI}
          />
        </div>
        <div>
          <h3 className="font-semibold text-accent-foreground">{token.name}</h3>
          <p className="text-sm text-accent-foreground space-x-1">
            <span>
              {formatNumber({
                value: amount ?? "0",
                decimalPlaces: 4,
              })}
            </span>
            <span>{token.symbol}</span>
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm text-accent-foreground font-semibold">
          {price !== undefined && amount !== undefined
            ? `$${formatNumber({ value: BigNumber(price).multipliedBy(amount).toFixed(), decimalPlaces: 2 })}`
            : null}
        </span>
      </div>
    </div>
  );
};

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
      return resp.data.balances;
    },
  });

  const { data: pricesMap } = useQuery({
    enabled: Boolean(result.data?.length && result.data?.length > 0),
    queryKey: ["token_price"],
    queryFn: async () => {
      const resp = await httpClient.get<APIPriceResponse>("/api/price", {
        params: {
          tokenAddresses: result.data?.map((o) => o.address).join(","),
        },
      });
      return resp.data.prices;
    },
  });

  const tokenList = useMemo(() => {
    if (!result.data || result.data.length === 0) {
      return [];
    }
    return result.data?.sort((tokenA, tokenB) => {
      const addressA = tokenA.address;
      const addressB = tokenB.address;
      const balanceA = balancesMap?.[addressA];
      const balanceB = balancesMap?.[addressB];
      const priceA = pricesMap?.[addressA];
      const priceB = pricesMap?.[addressB];
      const valueA = BigNumber(balanceA ?? "0").multipliedBy(priceA ?? "0");
      const valueB = BigNumber(balanceB ?? "0").multipliedBy(priceB ?? "0");
      if (valueA.eq(valueB)) {
        return 0;
      }
      return valueA.lt(valueB) ? 1 : -1;
    });
  }, [balancesMap, pricesMap, result.data]);

  if (result.isLoading) {
    return <div className="">Loading</div>;
  }
  if (!result.data || result.data.length === 0) {
    return <div className="">No token found</div>;
  }
  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto">
      {tokenList.map((item) => (
        <InteractiveDiv
          key={item.address}
          onClick={() => onTokenSelect?.(item)}
        >
          <TokenListItem
            token={item}
            amount={balancesMap?.[item.address]}
            price={pricesMap?.[item.address.toLowerCase()]}
          ></TokenListItem>
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
          <Button variant="default" className="rounded-full">
            {token.symbol}
          </Button>
        ) : (
          <Button variant="default" className="rounded-full">
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
