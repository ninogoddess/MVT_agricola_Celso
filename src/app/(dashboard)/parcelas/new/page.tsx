"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Locate } from "lucide-react";

export default function NewParcelaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [areaHectares, setAreaHectares] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Tu navegador no soporta geolocalización");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(7));
        setLongitude(position.coords.longitude.toFixed(7));
        setGeoLoading(false);
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
        if (data.fields) {
          setError(data.fields.map((f: { message: string }) => f.message).join(", "));
        } else {
          setError(data.error || "Error al crear parcela");
        }
        return;
      }

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
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex flex-col gap-2">
            <p>{error}</p>
            {error.toLowerCase().includes('límite') && (
              <button
                type="button"
                onClick={() => router.push('/planes')}
                className="mt-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 w-fit transition-colors"
              >
                Ver planes y mejorar
              </button>
            )}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Ej: Parcela Norte" />
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
            <p className="text-sm text-green-600 font-medium mt-2 flex items-center gap-1 bg-green-50 p-2 rounded-lg border border-green-200">
              <MapPin size={16} /> ¡Ubicación capturada con éxito!
            </p>
          )}
        </div>

        <div>
          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">Superficie (hectáreas)</label>
          <input id="area" type="number" step="0.01" min="0.01" value={areaHectares} onChange={(e) => setAreaHectares(e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="5.5" />
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
    </div>
  );
}
