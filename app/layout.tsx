import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "MWG FP&A Interactive Work Sample | Le Hoang Nghia",
    description:
      "Interactive MWG FP&A portfolio project: monthly reporting, Actual vs Budget, rolling forecast, working capital, Excel controls and formula practice.",
    openGraph: {
      title: "MWG FP&A — Interactive Work Sample",
      description: "Actuals · Variance · Forecast · Cash",
      type: "website",
      images: [`${origin}/og.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: "MWG FP&A — Interactive Work Sample",
      description: "Actuals · Variance · Forecast · Cash",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
