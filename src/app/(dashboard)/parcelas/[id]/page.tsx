"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ParcelaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [parcela, setParcela] = useState<Record<string, unknown> | null>(null);
  const [climate, setClimate] = useState<Record<string, unknown> | null>(null);
  const [cultivos, setCultivos] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/parcelas/${id}`).then(r => r.json()),
      fetch(`/api/parcelas/${id}/climate`).then(r => r.json()),
      fetch(`/api/parcelas/${id}/cultivos`).then(r => r.json()),
    ])
      .then(([p, c, cult]) => {
        setParcela(p);
        setClimate(c);
        setCultivos(Array.isArray(cult) ? cult : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;
  if (!parcela) return <p className="text-red-500">Parcela no encontrada</p>;

  const climateData = climate?.data as { temperature_celsius?: number; relative_humidity_percent?: number; wind_speed_kmh?: number; precipitation_probability_percent?: number } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{parcela.name as string}</h1>
        <Link href={`/recomendaciones/${id}`} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 min-h-[44px] flex items-center">
          Ver Recomendaciones
        </Link>
      </div>

      {/* Info parcela */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Latitud:</span> <span className="font-medium">{Number(parcela.latitude as string).toFixed(5)}</span></div>
          <div><span className="text-gray-500">Longitud:</span> <span className="font-medium">{Number(parcela.longitude as string).toFixed(5)}</span></div>
          <div><span className="text-gray-500">Superficie:</span> <span className="font-medium">{parcela.area_hectares as string} ha</span></div>
        </div>
      </div>

      {/* Clima actual */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">🌤️ Clima Actual</h2>
        {climateData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-700">{climateData.temperature_celsius ?? "—"}°C</div>
              <div className="text-blue-500 text-xs">Temperatura</div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-cyan-700">{climateData.relative_humidity_percent ?? "—"}%</div>
              <div className="text-cyan-500 text-xs">Humedad</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-gray-700">{climateData.wind_speed_kmh ?? "—"} km/h</div>
              <div className="text-gray-500 text-xs">Viento</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-indigo-700">{climateData.precipitation_probability_percent ?? "—"}%</div>
              <div className="text-indigo-500 text-xs">Prob. Lluvia</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">{climate?.isStale ? "Datos desactualizados" : "Sin datos climáticos disponibles"}</p>
        )}
      </div>

      {/* Cultivos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">🌿 Cultivos</h2>
          <Link href={`/cultivos/${id}`} className="text-green-600 text-sm font-medium hover:underline">
            Ver todos →
          </Link>
        </div>
        {cultivos.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin cultivos registrados</p>
        ) : (
          <ul className="space-y-2">
            {cultivos.slice(0, 5).map((c) => (
              <li key={c.id as string} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium capitalize">{c.species as string} {c.variety ? `(${c.variety})` : ""}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  c.status === "active" ? "bg-green-100 text-green-700" :
                  c.status === "harvested" ? "bg-blue-100 text-blue-700" :
                  "bg-red-100 text-red-700"
                }`}>{c.status as string}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
