"use client";

import { useEffect, useState } from "react";

interface Alert {
  id: string;
  alert_type: string;
  detected_value: string;
  threshold_value: string;
  status: string;
  grouped_count: number;
  created_at: string;
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alerts")
      .then((r) => r.json())
      .then((d) => setAlerts(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/alerts/${id}/read`, { method: "PATCH" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-lg" />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Alertas</h1>

      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-500">No hay alertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-lg border border-red-200 p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">
                  {formatAlertType(alert.alert_type)}
                  {alert.grouped_count > 1 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      ×{alert.grouped_count}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Valor: {alert.detected_value} | Umbral: {alert.threshold_value}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(alert.created_at).toLocaleString("es-CL")}
                </div>
              </div>
              <button
                onClick={() => markAsRead(alert.id)}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 min-h-[44px] min-w-[44px]"
              >
                ✓ Leída
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAlertType(type: string) {
  const map: Record<string, string> = {
    temp_min: "🥶 Temperatura baja",
    temp_max: "🔥 Temperatura alta",
    soil_humidity_min: "💧 Humedad de suelo baja",
    precipitation_high: "🌧️ Precipitación alta",
  };
  return map[type] ?? type;
}
