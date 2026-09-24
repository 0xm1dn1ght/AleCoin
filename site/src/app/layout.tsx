import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
