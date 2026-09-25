import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { IntroOverlay } from "@/components/ui/IntroOverlay";
import { PageTransitionProvider } from "@/components/ui/PageTransitionProvider";
import "./globals.css";
import { BRAND, OG_IMAGE } from "@/config/brand";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jardín El Encanto | Casa de Eventos en Cota, Cundinamarca",
  description:
    "Celebra tus momentos más especiales en Jardín El Encanto. Bodas, quinces años, eventos empresariales y revelación de género en Cota, Cundinamarca.",
  metadataBase: new URL(BRAND.url),
  keywords: [
    "Jardín El Encanto",
    "jardín de eventos Cota",
    "bodas Cota",
    "quince años Cundinamarca",
    "salón de eventos Cota",
    "eventos empresariales Cota",
    "revelación de género Cota",
  ],
  icons: {
    icon: "/trebol-original.svg",
    shortcut: "/trebol-original.svg",
  },
  openGraph: {
    title: "Jardín El Encanto | Casa de Eventos",
    description:
      "Celebra tus momentos más especiales en Jardín El Encanto, Cota, Cundinamarca.",
    locale: "es_CO",
    type: "website",
    siteName: BRAND.name,
    url: BRAND.url,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} h-full antialiased overflow-x-hidden scroll-smooth`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <IntroOverlay />
        <PageTransitionProvider>{children}</PageTransitionProvider>
      </body>
    </html>
  );
}
