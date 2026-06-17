import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA. Define el nombre "Agrencia" que se muestra al instalar la
 * app en la pantalla de inicio del móvil, así como íconos, colores y modo standalone.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agrencia",
    short_name: "Agrencia",
    description: "Gestión inteligente de cultivos: clima, recomendaciones y recordatorios para tu campo.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    lang: "es",
    orientation: "portrait",
    icons: [
      { src: "/assets/logo_principal.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/assets/logo_principal.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/assets/logo_principal.png", sizes: "any", type: "image/png", purpose: "maskable" },
    ],
  };
}
