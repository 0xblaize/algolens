import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgoraLens | AI Market Integrity",
  description:
    "AI market integrity dashboard for prediction market audits, simulated USDC routing, and lifecycle settlement monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
