import { assets } from "@/config/assets/assets";
import { isNativeToken } from "@/lib/address";

import { SwapContextProvider } from "./components/context";
import { GithubButton } from "./components/github-button";
import { MainButton } from "./components/main-button";
import { ThemeToggle } from "./components/theme-toggle";
import { BuySection, SellSection } from "./components/token-section";
import { TokenSwitch } from "./components/token-switch";
import { WalletConnect } from "./components/wallet-button";

export default async function SwapPage() {
  const sellToken = assets.find((o) => isNativeToken(o.address));
  const buyToken = assets.find(
    (o) => o.address === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  );
  return (
    <SwapContextProvider sellToken={sellToken} buyToken={buyToken}>
      <div className="flex flex-col container mx-auto px-3 min-h-[100vh]">
        <div className="flex flex-row justify-between h-16 items-center max-w-7xl mx-auto w-full">
          <div className=""></div>
          <div className="flex flex-row items-center gap-1">
            <WalletConnect />
            <ThemeToggle />
            <GithubButton />
          </div>
        </div>
        <div className="flex flex-1 justify-center">
          <div className="relative flex flex-col pt-0 lg:pt-20">
            <SellSection />
            <div className="h-2"></div>
            <div className="flex flex-row justify-center items-center rounded-full">
              <TokenSwitch />
            </div>
            <div className="h-2"></div>
            <BuySection />
            <div className="h-4"></div>
            <MainButton />
          </div>
        </div>
      </div>
    </SwapContextProvider>
  );
}
