"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  WagmiProvider,
} from "wagmi";
import { polygon } from "wagmi/chains";

import { clientConfig } from "@/config/client";

const config = createConfig({
  chains: [polygon],
  ssr: true,
  transports: {
    [polygon.id]: http(clientConfig.polygonRpcUrl),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
});

type Props = {
  children: React.ReactNode;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export const Provider = ({ children }: Props) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>{children}</JotaiProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </NextThemesProvider>
  );
};
