import "./globals.css";

import type { Metadata } from "next";
import localFont from "next/font/local";

import { Toaster } from "@/components/ui/toaster";

import { Provider } from "./provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Classic Swap",
  description:
    "A set of API endpoints for cryptocurrency trading and information retrieval",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Extra attributes from the server: class,style hydration issue by dark mode
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Provider>{children}</Provider>
        <Toaster />
      </body>
    </html>
  );
}
