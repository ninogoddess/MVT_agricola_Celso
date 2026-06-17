import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agrencia — Gestión inteligente de cosechas",
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
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
