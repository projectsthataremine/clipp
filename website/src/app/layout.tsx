import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast/ToastContext";
import { Theme } from "@radix-ui/themes";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
          <div id="app-root" className="app-container">
            <ToastProvider>{children}</ToastProvider>
          </div>
        </Theme>
      </body>
    </html>
  );
}
