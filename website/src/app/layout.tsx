import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/Toast/ToastContext";

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
        <div id="app-root" className="app-container">
          <ToastProvider>{children}</ToastProvider>
        </div>
      </body>
    </html>
  );
}
