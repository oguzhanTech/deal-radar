import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ServiceWorkerRegistrar } from "@/components/layout/sw-registrar";
import "./globals.css";

const PublicUserProfileModalHost = dynamic(
  () =>
    import("@/components/profile/public-user-profile-modal").then(
      (m) => m.PublicUserProfileModalHost
    ),
  { loading: () => null }
);

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  // 800 kaldırıldı: `font-extrabold` globals.css içinde 700’e eşleniyor (woff2 indirimi)
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.topla.online";
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;

const supabasePreconnectOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
  title: {
    default: "Topla — En güzel fırsatları kaçırma!",
    template: "%s | Topla",
  },
  description:
    "Topluluk destekli fırsat ve indirim hatırlatıcısı. Dijital ürün ve aboneliklerde en iyi fırsatlar.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
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
      <head>
        {supabasePreconnectOrigin && (
          <link rel="preconnect" href={supabasePreconnectOrigin} crossOrigin="anonymous" />
        )}
      </head>
      <body
        className={`min-h-dvh antialiased bg-background ${fontSans.className}`}
        suppressHydrationWarning
      >
        {GA_MEASUREMENT_ID && (
          <>
            {/* idle/load sonrası: ilk boyama ve LCP ile yarışmayı azaltır (consent sonrası yükleme ayrıca değerlendirilebilir) */}
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="lazyOnload"
            />
            <Script id="gtag-config" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        {children}
        <PublicUserProfileModalHost />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
