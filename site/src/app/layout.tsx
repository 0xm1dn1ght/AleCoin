import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/800.css";
import "./globals.css";
import { WalletWatcher } from "@/components/WalletWatcher";

export const metadata: Metadata = {
  title: "AleCoin",
  description: "AleCoin (ALE) — токен на Polygon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="flex min-h-dvh flex-col">
        <WalletWatcher />
        {children}
      </body>
    </html>
  );
}
