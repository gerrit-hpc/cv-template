import "@/app/globals.css";
import type { ReactNode } from "react";
import { geistSans, geistMono } from "@/lib/fonts";

export const metadata = { title: "KB" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
