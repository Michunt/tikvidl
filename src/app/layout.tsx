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
  title: "TikVidl - Download TikTok Videos Without Watermark",
  description: "TikVidl is a free online tool to download TikTok videos without watermark in high quality. Fast, easy, and secure.",
  keywords: "tiktok downloader, tiktok video downloader, download tiktok, no watermark, tiktok saver, tikvidl, tik tok download",
  metadataBase: new URL("https://tikvidl.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "TikVidl - Download TikTok Videos Without Watermark",
    description: "Download TikTok videos without watermark in high quality. Fast, easy, and secure.",
    url: "https://tikvidl.com",
    siteName: "TikVidl",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TikVidl - Download TikTok Videos Without Watermark",
    description: "Download TikTok videos without watermark in high quality. Fast, easy, and secure.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-indigo-50 to-pink-50 dark:from-gray-900 dark:to-indigo-950`}
      >
        {children}
      </body>
    </html>
  );
}
