"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewParcelaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [areaHectares, setAreaHectares] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Ej: Parcela Norte" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
            <input id="lat" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="-33.45" />
          </div>
          <div>
            <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
            <input id="lng" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="-70.66" />
          </div>
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
