import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: 'FLIP-N PRO | AI英単語フラッシュカード',
  description: 'AIが未知の英単語を自動抽出してフラッシュカードを生成する、進化系暗記アプリ。間隔反復（SRS）アルゴリズム搭載。',
  keywords: ['Flip-N', 'フリップエヌ', '英単語', 'フラッシュカード', '暗記アプリ', 'AI学習'],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="google-site-verification" content="a9d1ACZSw9i3cW483QCIuHXaIu6_sxAjQDCvpKJVFWQ" />
        <meta property="og:site_name" content="Flip-N" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Flip-N",
              "url": "https://flip-n.vercel.app/"
            })
          }}
        />
        <link rel="icon" href="/icon.png" type="image/png" />
        {/* サイズ違い（48x48pxなど）やapple用もあるとより確実です */}
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
