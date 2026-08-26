import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PARALLAX — Semantic debugger for the agentic web",
  description:
    "Inspect the semantic gap between human-facing interfaces and WebMCP tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
