import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { assetPath } from "../lib/path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "宝贝的生日礼物",
  description: "上传图片，调整精细度，一键生成像素画图纸，简单实用的像素画生成工具",
  manifest: assetPath("/manifest.json"),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "拼豆生成器",
    },
    icons: {
      icon: [
        { url: assetPath("/icon-192x192.png"), sizes: "192x192", type: "image/png" },
        { url: assetPath("/icon-512x512.png"), sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: assetPath("/icon-192x192.png"), sizes: "192x192", type: "image/png" },
      ],
    },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {children}
        <Script
          src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js"
          strategy="lazyOnload"
        />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7207313144293144"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
