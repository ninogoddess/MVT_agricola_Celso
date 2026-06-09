"use client";

import { useEffect, useState } from "react";

/**
 * Persiste el estado de un banner en localStorage.
 * Retorna: visible, dismiss (ocultar esta sesión), neverShow (ocultar siempre)
 */
export function useBannerState(key: string) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== "never") setVisible(true);
  }, [key]);

  function dismiss() { setVisible(false); }

  function neverShow() {
    localStorage.setItem(key, "never");
    setVisible(false);
  }

  return { visible, dismiss, neverShow };
}
