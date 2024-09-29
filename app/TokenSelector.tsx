"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

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
import { Token } from "@/types/base";

const TokenList = ({
  onTokenSelect,
}: {
  onTokenSelect?: (token: Token) => void;
}) => {
  const result = useQuery({
    queryKey: ["token_list"],
    queryFn: async () => {
      const resp = await httpClient.get<Token[]>("/api/tokens");
      return resp.data;
    },
  });
  if (result.isLoading) {
    return <div className="">Loading</div>;
  }
  if (!result.data || result.data.length === 0) {
    return null;
  }
  return (
    <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto">
      {result.data.map((token) => (
        <InteractiveDiv
          key={token.symbol}
          onClick={() => onTokenSelect?.(token)}
        >
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  className="w-8 h-8 rounded-full"
                  src={token.logoURI ?? ""}
                  alt={token.name}
                />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{token.name}</h3>
                <p className="text-sm text-gray-500">{token.symbol}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600">$1</span>
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
