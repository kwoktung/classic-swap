import { isNativeToken } from "@/lib/address";
import { assets } from "@/lib/assets";

import { SwapContextProvider } from "./context";
import { MainButton } from "./MainButton";
import { SwitchTokens } from "./SwitchTokens";
import { ThemeToggle } from "./ThemeButton";
import { BuySection, SellSection } from "./TokenSection";
import { WalletConnect } from "./WalletButton";

export default async function Home() {
  const sellToken = assets.find((o) => isNativeToken(o.address));
  const buyToken = assets.find(
    (o) => o.address === "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  );
  return (
    <SwapContextProvider sellToken={sellToken} buyToken={buyToken}>
      <div className="flex flex-col px-3">
        <div className="flex flex-row justify-between py-3">
          <div className=""></div>
          <div className="flex flex-row items-center gap-1">
            <WalletConnect />
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 justify-center items-center">
          <div className="relative flex flex-col">
            <SellSection />
            <div className="h-2"></div>
            <div className="flex flex-row justify-center items-center rounded-full">
              <SwitchTokens />
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
