"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Sprout, FlaskConical, Lightbulb, CalendarCheck, CloudSun } from "lucide-react";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";

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

  const lat = parcela ? Number(parcela.latitude) : null;
  const lon = parcela ? Number(parcela.longitude) : null;
  const { location, loading: geoLoading } = useReverseGeocode(lat, lon);

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;
  if (!parcela) return <p className="text-red-500">Parcela no encontrada</p>;

  const climateData = climate?.data as { temperature_celsius?: number; relative_humidity_percent?: number; wind_speed_kmh?: number; precipitation_probability_percent?: number } | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{parcela.name as string}</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin size={13} className="text-gray-400" />
            {geoLoading ? "Obteniendo ubicación..." : location ?? `${lat?.toFixed(4)}, ${lon?.toFixed(4)}`}
          </p>
        </div>
        <Link href={`/recomendaciones/${id}`} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 min-h-[44px] flex items-center">
          Ver Recomendaciones
        </Link>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: `/cultivos/${id}`, label: "Cultivos", icon: Sprout },
          { href: `/suelo/${id}`, label: "Suelo", icon: FlaskConical },
          { href: `/recomendaciones/${id}`, label: "Recomendaciones", icon: Lightbulb },
          { href: "/recordatorios", label: "Recordatorios", icon: CalendarCheck },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow min-h-[44px]">
            <item.icon size={20} className="text-green-600" />
            <span className="text-xs text-gray-600">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Info parcela */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Información</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium">{location ?? `${lat?.toFixed(5)}, ${lon?.toFixed(5)}`}</span>
              </div>
          <div><span className="text-gray-500">Coordenadas: </span><span className="font-mono text-xs">{lat?.toFixed(5)}, {lon?.toFixed(5)}</span></div>
          <div><span className="text-gray-500">Superficie: </span><span className="font-medium">{parcela.area_hectares as string} ha</span></div>
        </div>
      </div>

      {/* Clima actual */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <CloudSun size={18} className="text-blue-500" /> Clima Actual
        </h2>
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
          <p className="text-gray-500 text-sm">Sin datos climáticos aún. Los datos se actualizan diariamente.</p>
        )}
      </div>

      {/* Cultivos */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Sprout size={16} className="text-green-600" /> Cultivos
          </h2>
          <Link href={`/cultivos/${id}`} className="text-green-600 text-sm font-medium hover:underline min-h-[44px] flex items-center">
            Gestionar →
          </Link>
        </div>
        {cultivos.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm mb-2">Sin cultivos registrados</p>
            <Link href={`/cultivos/${id}`} className="text-green-600 text-sm font-medium hover:underline">+ Agregar primer cultivo</Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {cultivos.slice(0, 5).map((c) => (
              <li key={c.id as string} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium capitalize">{c.species as string}{c.variety ? ` — ${c.variety}` : ""}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  c.status === "active" ? "bg-green-100 text-green-700" :
                  c.status === "harvested" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                }`}>{c.status === "active" ? "Activo" : c.status === "harvested" ? "Cosechado" : "Perdido"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
