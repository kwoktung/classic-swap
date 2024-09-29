"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  cookieStorage,
  createConfig,
  createStorage,
  http,
  WagmiProvider,
} from "wagmi";
import { polygon } from "wagmi/chains";

const config = createConfig({
  chains: [polygon],
  ssr: true,
  transports: {
    [polygon.id]: http(process.env.POLYGON_RPC),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
});

type Props = {
  children: React.ReactNode;
};

const queryClient = new QueryClient();

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
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </NextThemesProvider>
  );
};
