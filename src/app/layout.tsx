import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgoraLens | AI Market Integrity",
  description:
    "AI market integrity dashboard for prediction market audits, Arc Testnet receipts, and lifecycle settlement monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full overflow-x-hidden antialiased">
      <body className="min-h-full flex flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
