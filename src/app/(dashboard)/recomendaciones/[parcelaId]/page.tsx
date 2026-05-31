"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Recommendation {
  id: string;
  recommendation_type: string;
  payload: {
    windowStart: string;
    windowEnd: string;
    estimatedHarvestDate?: string;
    reasoning: string;
    climateSnapshot: { temperature: number; humidity: number; precipitationProb: number };
  };
  is_stale: boolean;
  generated_at: string;
}

export default function RecomendacionesPage() {
  const { parcelaId } = useParams<{ parcelaId: string }>();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/parcelas/${parcelaId}/recommendations`)
      .then((r) => r.json())
      .then((d) => setRecommendations(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [parcelaId]);

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Recomendaciones</h1>

      {recommendations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">🌾</div>
          <p className="text-gray-500">No hay recomendaciones disponibles</p>
          <p className="text-sm text-gray-400 mt-1">Agrega cultivos para recibir recomendaciones de siembra y cosecha</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  rec.recommendation_type === "siembra" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {rec.recommendation_type === "siembra" ? "🌱 Siembra" : "🌾 Cosecha"}
                </span>
                {rec.is_stale && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">⚠️ Datos desactualizados</span>
                )}
              </div>

              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Ventana óptima:</span>{" "}
                  <span className="font-medium">
                    {new Date(rec.payload.windowStart).toLocaleDateString("es-CL")} — {new Date(rec.payload.windowEnd).toLocaleDateString("es-CL")}
                  </span>
                </p>
                {rec.payload.estimatedHarvestDate && (
                  <p><span className="text-gray-500">Cosecha estimada:</span>{" "}
                    <span className="font-medium">{new Date(rec.payload.estimatedHarvestDate).toLocaleDateString("es-CL")}</span>
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{rec.payload.reasoning}</p>

              <div className="flex gap-3 text-xs text-gray-400">
                <span>🌡️ {rec.payload.climateSnapshot.temperature}°C</span>
                <span>💧 {rec.payload.climateSnapshot.humidity}%</span>
                <span>🌧️ {rec.payload.climateSnapshot.precipitationProb}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
