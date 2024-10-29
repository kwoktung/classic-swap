"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { range } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { useAccount } from "wagmi";

import { httpClient } from "@/client/http";
import {
  InteractiveDiv,
  InteractiveInput,
} from "@/components/interactive-elements";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTokenPrice } from "@/hooks/use-token-price";
import { formatNumber } from "@/lib/format";
import { APIBalanceResponse, APITokensResponse } from "@/types/apis";
import { Token } from "@/types/base";

type TokenListItemProps = {
  token: Token;
  amount?: string;
  price?: string;
};

const TokenListItem = ({ token, amount, price }: TokenListItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow cursor-pointer hover:bg-muted/30 transition">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
          <img
            className="w-full h-full rounded-full"
            src={token.logoURI ?? ""}
            alt={token.symbol}
          />
        </div>
        <div>
          <h3 className="font-semibold text-accent-foreground select-none">
            {token.name}
          </h3>
          <p className="text-sm space-x-1 select-none  text-primary/80">
            {token.symbol}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <h3 className="font-semibold text-accent-foreground select-none">
          {price !== undefined && amount !== undefined
            ? `$${formatNumber({ value: BigNumber(price).multipliedBy(amount).toFixed(), decimalPlaces: 2 })}`
            : null}
        </h3>
        <span className="text-sm space-x-1 select-none  text-primary/80">
          {amount !== undefined
            ? formatNumber({
                value: amount ?? "0",
                decimalPlaces: 4,
              })
            : null}
        </span>
      </div>
    </div>
  );
};

const TokenListContainer = ({
  onTokenSelect,
}: {
  onTokenSelect?: (token: Token) => void;
}) => {
  const [keyword, setKeyword] = useState("");
  const [debounceKey] = useDebounce(keyword, 300);
  return (
    <div className="flex flex-col relative px-4 md:px-0">
      <div className="flex flex-row items-center mb-4">
        <div className="flex  flex-row absolute w-8 justify-center">
          <MagnifyingGlassIcon />
        </div>
        <InteractiveInput
          className="flex-1 px-8 py-2 rounded-md"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search Tokens"
        ></InteractiveInput>
      </div>
      <div className="h-[500px] md:h-[650px]">
        <TokenList
          onTokenSelect={onTokenSelect}
          keyword={debounceKey}
        ></TokenList>
      </div>
    </div>
  );
};

const TokenList = ({
  onTokenSelect,
  keyword,
}: {
  onTokenSelect?: (token: Token) => void;
  keyword?: string;
}) => {
  const account = useAccount();
  const result = useQuery({
    queryKey: ["tokens", keyword],
    queryFn: async () => {
      const resp = await httpClient.get<APITokensResponse>("/api/token", {
        params: keyword ? { keyword } : undefined,
      });
      const { assets } = resp.data;
      return assets;
    },
  });

  const balanceEnabled = Boolean(
    result.data?.length && result.data?.length > 0 && account.address,
  );

  const { data: balancesMap } = useQuery({
    enabled: balanceEnabled,
    queryKey: ["balances", account.address],
    queryFn: async () => {
      const resp = await httpClient.post<APIBalanceResponse>("/api/balance", {
        accountAddress: account.address,
        tokenAddresses: result.data?.map((o) => o.address),
      });
      return resp.data.balances;
    },
  });

  const priceTokenAddresses = balancesMap ? Object.keys(balancesMap) : [];

  const { data: pricesMap } = useTokenPrice({
    enabled: priceTokenAddresses.length > 0,
    tokenAddresses: priceTokenAddresses,
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
    return (
      <div className="space-y-4">
        {range(0, 10, 1).map((o) => {
          return (
            <div key={o} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[75px]" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  if (!result.data || result.data.length === 0) {
    return <div className="">No token listed</div>;
  }
  return (
    <div className="space-y-4 overflow-y-auto h-full">
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

type TokenSelectStateProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  token?: Token;
  onTokenSelect?: (token: Token) => void;
};

const DialogTokenSelect = ({
  isOpen,
  setIsOpen,
  token,
  onTokenSelect,
}: TokenSelectStateProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="rounded-full">
          {token ? token.symbol : "Select Token"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
          <DialogDescription hidden>Token Selector</DialogDescription>
        </DialogHeader>
        <TokenListContainer onTokenSelect={onTokenSelect} />
      </DialogContent>
    </Dialog>
  );
};

const DrawerTokenSelect = ({
  isOpen,
  setIsOpen,
  token,
  onTokenSelect,
}: TokenSelectStateProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button variant="default" className="rounded-full">
          {token ? token.symbol : "Select Token"}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Select a token</DrawerTitle>
          <DrawerDescription hidden>Token Selector</DrawerDescription>
        </DrawerHeader>
        <TokenListContainer onTokenSelect={onTokenSelect} />
      </DrawerContent>
    </Drawer>
  );
};

type TokenSelectorProps = {
  token?: Token;
  onSelect?: (token: Token) => void;
};

export function TokenSelector({ token, onSelect }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const onTokenSelect = useCallback(
    (token: Token) => {
      onSelect?.(token);
      setIsOpen(false);
    },
    [onSelect],
  );
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const Comp = isDesktop ? DialogTokenSelect : DrawerTokenSelect;
  return (
    <Comp
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      token={token}
      onTokenSelect={onTokenSelect}
    ></Comp>
  );
}
