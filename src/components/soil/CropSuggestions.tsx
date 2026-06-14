"use client";

import { useEffect, useState } from "react";
import { Sprout, CheckCircle2, AlertTriangle, Lightbulb } from "lucide-react";

interface Suggestion {
  species: string;
  variety: string | null;
  score: number;
  diasACosecha: number;
  reasons: string[];
  warnings: string[];
  inSeason: boolean;
}

interface ApiResponse {
  error?: string;
  message?: string;
  soil?: { ph: number; humidityPercent: number; measurementDate: string };
  currentTemperature?: number | null;
  suggestions?: Suggestion[];
}

function scoreColor(score: number) {
  if (score >= 75) return { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-50" };
  if (score >= 50) return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  return { bar: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50" };
}

export default function CropSuggestions({ parcelaId }: { parcelaId: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parcelas/${parcelaId}/crop-suggestions`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: "ERROR" }))
      .finally(() => setLoading(false));
  }, [parcelaId]);

  if (loading) return <div className="h-40 skeleton rounded-xl" />;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Lightbulb size={18} className="text-green-600" /> Cultivos recomendados para tu suelo
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Según tu último análisis de suelo, la ubicación de la parcela y el clima actual.
      </p>

      {data?.error === "NO_SOIL" ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          {data.message ?? "Ingresa un registro de suelo para ver recomendaciones."}
        </p>
      ) : !data?.suggestions?.length ? (
        <p className="text-sm text-gray-500 py-4 text-center">No se pudieron calcular recomendaciones.</p>
      ) : (
        <>
          {data.soil && (
            <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-x-4 gap-y-1">
              <span>pH: <strong className="text-gray-700">{data.soil.ph}</strong></span>
              <span>Humedad: <strong className="text-gray-700">{data.soil.humidityPercent}%</strong></span>
              {data.currentTemperature != null && (
                <span>Temp. actual: <strong className="text-gray-700">{Math.round(data.currentTemperature)}°C</strong></span>
              )}
            </div>
          )}

          <ul className="space-y-3">
            {data.suggestions.map((s) => {
              const c = scoreColor(s.score);
              return (
                <li key={`${s.species}-${s.variety ?? ""}`} className={`rounded-xl border border-gray-100 p-3 ${c.bg}`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sprout size={16} className="text-green-600 flex-shrink-0" />
                      <span className="font-medium text-gray-800 capitalize truncate">
                        {s.species}{s.variety ? <span className="text-gray-400 font-normal"> · {s.variety}</span> : null}
                      </span>
                      {s.inSeason && (
                        <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">En temporada</span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${c.text} flex-shrink-0`}>{s.score}%</span>
                  </div>

                  {/* Barra de aptitud */}
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${s.score}%` }} />
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    {s.reasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{r}</span>
                      </div>
                    ))}
                    {s.warnings.slice(0, 1).map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>

                  <div className="text-[11px] text-gray-400 mt-1.5">Cosecha aprox. en {s.diasACosecha} días desde siembra</div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
