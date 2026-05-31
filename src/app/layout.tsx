import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgroSmart - Gestión de Cosechas Inteligentes",
  description: "Sistema de gestión agrícola con datos climáticos en tiempo real, recomendaciones de siembra/cosecha y recordatorios de tareas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
