import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/layout/sw-registrar";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-92MP5DC776";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://topla.online";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Topla — En güzel fırsatları kaçırma!",
    template: "%s | Topla",
  },
  description:
    "Topluluk destekli fırsat ve indirim hatırlatıcısı. Dijital ürün ve aboneliklerde en iyi fırsatlar.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Topla",
    title: "Topla — En güzel fırsatları kaçırma!",
    description: "Topluluk destekli fırsat ve indirim hatırlatıcısı. Dijital ürün ve aboneliklerde en iyi fırsatlar.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Topla — En güzel fırsatları kaçırma!",
    description: "Topluluk destekli fırsat ve indirim hatırlatıcısı.",
  },
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Topla",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`min-h-dvh antialiased ${fontSans.className}`} suppressHydrationWarning>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
