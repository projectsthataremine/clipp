import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clipp - Simple Clipboard Manager for Mac ($2/month)",
  description: "Simple clipboard history for Mac. Never lose what you copied. Save favorites, track unlimited history, works with text, images, files & media. 100% local storage. 7-day free trial, no credit card required.",
  keywords: ["clipboard manager", "clipboard history", "mac clipboard", "copy paste manager", "clipboard tool", "macos clipboard"],
  openGraph: {
    title: "Clipp - Simple Clipboard Manager for Mac",
    description: "Clipboard history made simple. Built for people who don't need the extras — just simple clipboard history.",
    type: "website",
    siteName: "Clipp",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clipp - Simple Clipboard Manager for Mac",
    description: "Never lose what you copied. Simple clipboard history for Mac.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
