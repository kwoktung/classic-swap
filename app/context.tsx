"use client";
import { useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";

import { httpClient } from "@/client/http";
import { toReadableNumber } from "@/lib/format";
import { APIQuoteResponse } from "@/types/apis";
import { Token } from "@/types/base";

type ISwapState = {
  sellToken?: Token;
  buyToken?: Token;
  amount?: string;
};

type ISetSwapState = (
  state: ISwapState | ((prevState: ISwapState) => ISwapState),
) => void;

type ISwapContext = {
  swapState: ISwapState;
  setSwapState: ISetSwapState;
};

type ISwapActions = {
  setSellToken?: (token: Token) => void;
  setBuyToken?: (token: Token) => void;
  setAmount?: (amount: string) => void;
  switchTokens?: () => void;
  clear?: () => void;
};

type SwapContextProviderProps = {
  children: ReactNode;
  sellToken?: Token;
  buyToken?: Token;
};

const SwapContext = createContext<ISwapContext>({
  swapState: {},
  setSwapState: () => {},
});

export const SwapContextProvider = ({
  children,
  sellToken,
  buyToken,
}: SwapContextProviderProps) => {
  const [swapState, setSwapState] = useState<ISwapState>({
    amount: "",
    sellToken,
    buyToken,
  });
  const value = useMemo<ISwapContext>(() => {
    return {
      swapState,
      setSwapState,
    };
  }, [swapState]);

  return <SwapContext.Provider value={value}>{children}</SwapContext.Provider>;
};

export const useSwapState = () => {
  const { swapState } = useContext(SwapContext);
  return swapState;
};

export const useDeriveState = () => {
  const swapState = useSwapState();
  const [{ sellToken, buyToken, amount }] = useDebounce(swapState, 600);
  const result = useQuery<{ buyAmount: string; strategy?: string }>({
    enabled: Boolean(sellToken && buyToken && Number(amount) > 0),
    queryKey: [sellToken?.address, buyToken?.address, amount],
    queryFn: async () => {
      if (sellToken && buyToken && amount) {
        const resp = await httpClient.get<APIQuoteResponse>("/api/quote", {
          params: {
            src: sellToken?.address,
            dst: buyToken.address,
            amount: BigNumber(amount).shiftedBy(sellToken.decimals),
          },
        });
        return {
          buyAmount: toReadableNumber({
            value: resp.data.buyAmount,
            decimals: buyToken.decimals,
          }),
          strategy: resp.data.strategy,
        };
      }
      return {
        buyAmount: "",
      };
    },
    retry: 1,
    staleTime: 5 * 1000,
    gcTime: 5 * 1000,
  });

  return {
    loading: result.isLoading,
    isPending: result.isPending,
    isFetching: result.isFetching,
    data: result.data,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useSwapActions = () => {
  const { setSwapState } = useContext(SwapContext);
  return useMemo<ISwapActions>(() => {
    const setBuyToken = (token: Token) => {
      setSwapState((prev) => {
        const { sellToken } = prev;
        if (sellToken && sellToken.address === token.address) {
          return { ...prev, sellToken: undefined, buyToken: token };
        }
        return { ...prev, buyToken: token };
      });
    };
    const setSellToken = (token: Token) => {
      setSwapState((prev) => {
        const { buyToken } = prev;
        if (buyToken && buyToken.address === token.address) {
          return { ...prev, buyToken: undefined, sellToken: token };
        }
        return { ...prev, sellToken: token };
      });
    };
    const setAmount = (amount: string) => {
      setSwapState((prev) => ({ ...prev, amount }));
    };
    const switchTokens = () => {
      setSwapState((prev) => {
        return {
          ...prev,
          sellToken: prev.buyToken,
          buyToken: prev.sellToken,
        };
      });
    };
    const clear = () => setSwapState((prev) => ({ ...prev, amount: "" }));
    return { setBuyToken, setSellToken, setAmount, switchTokens, clear };
  }, [setSwapState]);
};
