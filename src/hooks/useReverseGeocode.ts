"use client";

import { useEffect, useState } from "react";

/**
 * Convierte coordenadas a texto de ubicación usando Nominatim (OpenStreetMap).
 * Completamente gratuito, sin API key.
 */
export function useReverseGeocode(lat: number | null, lon: number | null) {
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;
    setLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
      { headers: { "User-Agent": "AgroSmart/1.0" } }
    )
      .then((r) => r.json())
      .then((data) => {
        const addr = data.address;
        const parts = [
          addr.village || addr.town || addr.city || addr.municipality,
          addr.county || addr.state_district,
          addr.state,
        ].filter(Boolean);
        setLocation(parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(", "));
      })
      .catch(() => setLocation(null))
      .finally(() => setLoading(false));
  }, [lat, lon]);

  return { location, loading };
}
