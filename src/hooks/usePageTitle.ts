"use client";

import { useEffect } from "react";

/**
 * Fija el título de la pestaña del navegador por sección, en formato
 * "Sección · Agrencia". Mejora la orientación del usuario y el SEO.
 */
export function usePageTitle(section: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = section ? `${section} · Agrencia` : "Agrencia";
    return () => { document.title = previous; };
  }, [section]);
}
