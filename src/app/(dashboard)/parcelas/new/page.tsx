"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Locate } from "lucide-react";
import { UpgradeModal } from "@/components/ui/Modals";
import { useToast } from "@/components/ui/Toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function NewParcelaPage() {
  const router = useRouter();
  const toast = useToast();
  usePageTitle("Nueva parcela");
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [areaHectares, setAreaHectares] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; location?: string; area?: string }>({});
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [geoNameLoading, setGeoNameLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Convierte las coordenadas capturadas en un nombre de lugar legible (Nominatim).
  async function fetchLocationName(lat: number, lon: number) {
    setGeoNameLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
        { headers: { "Accept": "application/json" } }
      );
      const data = await res.json();
      const a = data.address ?? {};
      const parts = [
        a.village || a.town || a.city || a.municipality || a.hamlet || a.suburb,
        a.state,
        a.country,
      ].filter(Boolean);
      setLocationName(parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(", ") || "");
    } catch {
      setLocationName("");
    } finally {
      setGeoNameLoading(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat.toFixed(7));
        setLongitude(lon.toFixed(7));
        setGeoLoading(false);
        fetchLocationName(lat, lon);
      },
      (err) => {
        setError("No se pudo obtener la ubicación: " + err.message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validación visual inline
    const errs: { name?: string; location?: string; area?: string } = {};
    if (!name.trim()) errs.name = "Escribe un nombre para identificar la parcela";
    if (!latitude || !longitude) errs.location = "Toca el botón para capturar la ubicación";
    if (!areaHectares || Number(areaHectares) <= 0) errs.area = "Ingresa la superficie en hectáreas";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/parcelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          areaHectares: Number(areaHectares),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "LIMIT_EXCEEDED") {
          setShowUpgrade(true);
        } else if (data.fields) {
          setError(data.fields.map((f: { message: string }) => f.message).join(", "));
        } else {
          setError(data.error || "Error al crear parcela");
        }
        return;
      }

      toast.success("¡Parcela creada con éxito!");
      router.push("/parcelas");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Nueva Parcela</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border border-gray-200">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <p>{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input id="name" type="text" value={name} onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })); }} required
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${fieldErrors.name ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            placeholder="Ej: Parcela Norte" />
          {fieldErrors.name && <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={geoLoading}
            className="w-full py-3 px-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 hover:border-green-400 hover:text-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px] mb-4"
          >
            <Locate size={18} className={geoLoading ? "animate-pulse" : ""} /> 
            {geoLoading ? "Obteniendo coordenadas GPS..." : "Obtener mi ubicación actual"}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input id="lat" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-50 text-gray-600"
                placeholder="Latitud (-33.45)" readOnly={latitude !== ""} />
            </div>
            <div>
              <input id="lng" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-gray-50 text-gray-600"
                placeholder="Longitud (-70.66)" readOnly={longitude !== ""} />
            </div>
          </div>
          {latitude && longitude && (
            <div className="mt-2 bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                <MapPin size={16} /> ¡Ubicación capturada con éxito!
              </p>
              <p className="text-sm text-green-800 mt-1">
                {geoNameLoading
                  ? "Identificando lugar..."
                  : locationName
                    ? <>📍 {locationName}</>
                    : <>Coordenadas: {latitude}, {longitude}</>}
              </p>
              {locationName && (
                <p className="text-xs text-green-600 mt-0.5">Coordenadas: {latitude}, {longitude}</p>
              )}
            </div>
          )}
          {fieldErrors.location && <p className="text-red-600 text-xs mt-1">{fieldErrors.location}</p>}
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">Superficie (hectáreas)</label>
          <input id="area" type="number" step="0.01" min="0.01" value={areaHectares} onChange={(e) => { setAreaHectares(e.target.value); setFieldErrors((f) => ({ ...f, area: undefined })); }} required
            className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none ${fieldErrors.area ? "border-red-400 bg-red-50" : "border-gray-300"}`}
            placeholder="5.5" />
          {fieldErrors.area && <p className="text-red-600 text-xs mt-1">{fieldErrors.area}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[44px]">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 min-h-[44px]">
            {loading ? "Creando..." : "Crear Parcela"}
          </button>
        </div>
      </form>

      <UpgradeModal open={showUpgrade} resource="parcelas" onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
