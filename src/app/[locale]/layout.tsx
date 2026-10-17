import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Noto_Kufi_Arabic, Cairo, Familjen_Grotesk } from "next/font/google";
import "../globals.css";
import { PwaProvider } from "@/contexts/PwaContext";
import { PwaInstallBanner } from "@/components/pwa/PwaInstallBanner";
import { PwaIosModal } from "@/components/pwa/PwaIosModal";
import { PwaSuccessToast } from "@/components/pwa/PwaSuccessToast";

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["600", "700", "800"],
  variable: "--font-kufi",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const familjen = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-familjen",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mohasby.mahmoudashry.site"),
  title: {
    default: "مُحاسبي — دفتر حسابات عربي متزن للشركات المصرية",
    template: "%s | مُحاسبي",
  },
  description:
    "برنامج محاسبة سحابي عربي للشركات التجارية والتبريد والتخزين والتصنيع والزراعة في مصر. قيود يومية، مخازن وثلاجات، مراكز تكلفة وقوائم مالية متزنة من أول قيد.",
  keywords: [
    "محاسبي",
    "برنامج محاسبة مصري",
    "قيود يومية مزدوجة",
    "إدارة ثلاجات وتبريد",
    "حسابات مخازن ولوتات",
    "مراكز تكلفة",
    "تسوية بنكية وشيكات",
    "برنامج حسابات مصر",
  ],
  authors: [{ name: "مُحاسبي" }],
  creator: "مُحاسبي",
  publisher: "مُحاسبي",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "مُحاسبي — دفتر حسابات عربي متزن للشركات المصرية",
    description:
      "قيود اليومية والمخازن والثلاجات ومراكز التكلفة والبنوك والمرتبات، في دفتر محاسبي واحد يراجع نفسه قبل أن تراجعه أنت.",
    url: "https://mohasby.mahmoudashry.site",
    siteName: "مُحاسبي",
    locale: "ar_EG",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "مُحاسبي — نظام محاسبي سحابي متزن للشركات المصرية",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مُحاسبي — دفتر حسابات عربي متزن للشركات المصرية",
    description:
      "قيود اليومية والمخازن والثلاجات ومراكز التكلفة والبنوك، في دفتر يمنع الخطأ بدل أن يخفيه.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "مُحاسبي",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const messages = await getMessages();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "مُحاسبي",
    operatingSystem: "Cloud / Web Browser / Windows / Mac / Android / iOS",
    applicationCategory: "BusinessApplication",
    description:
      "برنامج محاسبة سحابي عربي للشركات التجارية والتبريد والتخزين والتصنيع والزراعة في مصر.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    inLanguage: "ar",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "128",
    },
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${notoKufi.variable} ${cairo.variable} ${familjen.variable}`}
    >
      <head>
        <meta name="theme-color" content="#1F4E42" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="مُحاسبي" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-canvas text-ink-900 antialiased selection:bg-accent-500/30 selection:text-green-950">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <PwaProvider>
            <PwaInstallBanner />
            <div
              style={{ paddingTop: 'var(--pwa-banner-height, 0px)' }}
              className="min-h-screen flex flex-col transition-all duration-300"
            >
              {children}
            </div>
            <PwaIosModal />
            <PwaSuccessToast />
          </PwaProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
