import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroInteligencia — Gestión inteligente de cosechas",
  description: "Plataforma agrícola con clima en tiempo real, recomendaciones de siembra y cosecha, y recordatorios automáticos para productores de Chile.",
  icons: {
    icon: [{ url: "/assets/logo_principal.png", type: "image/png", sizes: "any" }],
    shortcut: "/assets/logo_principal.png",
  },
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
