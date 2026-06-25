import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://agrencia.vercel.app";
const OG_IMAGE = `${SITE_URL}/assets/banner.png`;
const OG_TITLE = "Agrencia — Gestión inteligente de cosechas";
const OG_DESC = "Clima en tiempo real, recomendaciones de siembra y cosecha, y recordatorios automáticos para tu campo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: OG_TITLE,
  description: "Plataforma agrícola con clima en tiempo real, recomendaciones de siembra y cosecha, y recordatorios automáticos para productores de Chile.",
  applicationName: "Agrencia",
  appleWebApp: {
    capable: true,
    title: "Agrencia",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/assets/logo_principal.png", type: "image/png", sizes: "any" }],
    shortcut: "/assets/logo_principal.png",
    apple: "/assets/logo_principal.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/assets/logo_principal.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/assets/logo_principal.png" type="image/png" sizes="16x16" />
        <link rel="shortcut icon" href="/assets/logo_principal.png" />

        {/* Open Graph (preview al compartir en WhatsApp, Facebook, etc.) — explícito y absoluto */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Agrencia" />
        <meta property="og:title" content={OG_TITLE} />
        <meta property="og:description" content={OG_DESC} />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:locale" content="es_CL" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Agrencia — Gestión inteligente de cosechas" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={OG_TITLE} />
        <meta name="twitter:description" content={OG_DESC} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
