import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://chatsio-topaz.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chatsio — 상품 데이터 인프라",
    template: "%s | Chatsio",
  },
  description:
    "AI가 상품정보를 자동 구조화하고, AI 검색엔진 인용을 추적하는 SaaS",
  openGraph: {
    type: "website",
    siteName: "Chatsio",
    locale: "ko_KR",
    url: SITE_URL,
    title: "Chatsio — 쇼핑몰 상품 데이터 인프라",
    description:
      "URL만 연결하면 JSON-LD + llms.txt를 자동 생성하고 AI 검색엔진이 당신의 상품을 추천하는지 추적합니다.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatsio — 쇼핑몰 상품 데이터 인프라",
    description:
      "URL만 연결하면 JSON-LD + llms.txt를 자동 생성하고 AI 검색엔진이 당신의 상품을 추천하는지 추적합니다.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="ko"
      className={cn("h-full antialiased", dmSans.variable, jetbrainsMono.variable, "font-sans")}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface text-on-surface">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
