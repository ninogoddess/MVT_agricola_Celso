"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

interface DailyPoint {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitationProb: number | null;
  precipitationSum: number | null;
  isPast: boolean;
}

export default function ClimateChart({ parcelaId }: { parcelaId: string }) {
  const [data, setData] = useState<DailyPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/parcelas/${parcelaId}/climate/history`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) setData(res.data);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [parcelaId]);

  if (loading) return <div className="h-56 skeleton rounded-xl" />;
  if (error || !data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-600" /> Clima 7 días + pronóstico
        </h2>
        <p className="text-gray-500 text-sm">No se pudo cargar el histórico climático.</p>
      </div>
    );
  }

  // Escalas
  const temps = data.flatMap((d) => [d.tempMax, d.tempMin].filter((v): v is number => v != null));
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp || 1;

  const W = 100; // viewBox width units
  const H = 40;  // viewBox height units (zona de temperatura)
  const stepX = data.length > 1 ? W / (data.length - 1) : W;
  const y = (t: number) => H - ((t - minTemp) / range) * (H - 6) - 3;

  const maxLine = data.map((d, i) => `${i * stepX},${d.tempMax != null ? y(d.tempMax) : H / 2}`).join(" ");
  const minLine = data.map((d, i) => `${i * stepX},${d.tempMin != null ? y(d.tempMin) : H / 2}`).join(" ");

  const todayIdx = data.findIndex((d) => !d.isPast);
  const maxPrecip = Math.max(...data.map((d) => d.precipitationProb ?? 0), 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-600" /> Clima 7 días + pronóstico
        </h2>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500 inline-block" /> Máx</span>
          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> Mín</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-200 inline-block rounded-sm" /> Lluvia %</span>
        </div>
      </div>

      {/* Gráfico de temperatura */}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-40">
          {/* Separador hoy */}
          {todayIdx > 0 && (
            <line
              x1={todayIdx * stepX} y1={0} x2={todayIdx * stepX} y2={H}
              stroke="#d1d5db" strokeWidth={0.3} strokeDasharray="1,1"
            />
          )}
          <polyline points={maxLine} fill="none" stroke="#f97316" strokeWidth={0.6} strokeLinejoin="round" />
          <polyline points={minLine} fill="none" stroke="#3b82f6" strokeWidth={0.6} strokeLinejoin="round" />
        </svg>
      </div>

      {/* Etiquetas de días + barras de prob. lluvia */}
      <div className="grid mt-2" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((d) => {
          const day = new Date(d.date + "T00:00:00");
          const label = day.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "");
          const dayNum = day.getDate();
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="w-full px-0.5 flex items-end justify-center h-10">
                <div
                  className={`w-2 rounded-t ${d.isPast ? "bg-cyan-200" : "bg-cyan-400"}`}
                  style={{ height: `${((d.precipitationProb ?? 0) / maxPrecip) * 100}%` }}
                  title={`Prob. lluvia: ${d.precipitationProb ?? 0}%`}
                />
              </div>
              <span className={`text-[10px] leading-none ${d.isPast ? "text-gray-400" : "text-gray-700 font-semibold"}`}>
                {label}
              </span>
              <span className="text-[10px] leading-none text-gray-400">{dayNum}</span>
              <span className="text-[10px] leading-none text-gray-600">
                {d.tempMax != null ? `${Math.round(d.tempMax)}°` : "—"}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Línea punteada = hoy · datos reales de Open-Meteo para esta ubicación
      </p>
    </div>
  );
}
