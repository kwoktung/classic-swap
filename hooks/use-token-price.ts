import { useQuery } from "@tanstack/react-query";

import { httpClient } from "@/client/http";
import { APIPriceResponse } from "@/types/apis";

export const useTokenPrice = ({
  enabled,
  tokenAddresses,
}: {
  enabled?: boolean;
  tokenAddresses: string[];
}) => {
  return useQuery({
    enabled,
    queryKey: ["token-price", tokenAddresses],
    queryFn: async () => {
      const resp = await httpClient.post<APIPriceResponse>("/api/price", {
        tokenAddresses,
      });
      return resp.data.prices;
    },
  });
};
