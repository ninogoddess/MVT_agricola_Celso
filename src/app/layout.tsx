import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroInteligencia - Gestión de Cosechas Inteligentes",
  description: "Sistema de gestión agrícola con datos climáticos en tiempo real, recomendaciones de siembra/cosecha y recordatorios de tareas.",
  icons: {
    icon: [{ url: "/assets/logo_principal.png", type: "image/png" }],
    apple: "/assets/logo_principal.png",
    shortcut: "/assets/logo_principal.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/assets/logo_principal.png" type="image/png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
