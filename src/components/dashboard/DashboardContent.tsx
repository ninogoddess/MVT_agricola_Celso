"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  summary: {
    activeParcelas: number;
    activeCultivos: number;
    pendingAlerts: number;
    upcomingReminders: number;
  };
  parcelas: Array<{ id: string; name: string; latitude: string; longitude: string }>;
  recentAlerts: Array<{ id: string; alert_type: string; detected_value: string; parcela_id: string; created_at: string }>;
  upcomingReminders: Array<{ id: string; task_type: string; scheduled_at: string; parcela_id: string; status: string }>;
}

export default function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Error cargando dashboard</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon="🗺️" label="Parcelas" value={data.summary.activeParcelas} />
        <SummaryCard icon="🌿" label="Cultivos" value={data.summary.activeCultivos} />
        <SummaryCard icon="🔔" label="Alertas" value={data.summary.pendingAlerts} color="red" />
        <SummaryCard icon="📋" label="Recordatorios" value={data.summary.upcomingReminders} color="amber" />
      </div>

      {/* Alerts banner */}
      {data.recentAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="font-semibold text-red-800 mb-2">⚠️ Alertas Pendientes</h2>
          <ul className="space-y-2">
            {data.recentAlerts.map((alert) => (
              <li key={alert.id} className="text-sm text-red-700 flex justify-between">
                <span>{formatAlertType(alert.alert_type)}: {alert.detected_value}</span>
                <span className="text-red-500 text-xs">{formatDate(alert.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upcoming reminders */}
      {data.upcomingReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="font-semibold text-amber-800 mb-2">📋 Próximos Recordatorios</h2>
          <ul className="space-y-2">
            {data.upcomingReminders.map((reminder) => (
              <li key={reminder.id} className="text-sm text-amber-700 flex justify-between items-center">
                <span className="capitalize">{reminder.task_type}</span>
                <span className="text-amber-500 text-xs">{formatDate(reminder.scheduled_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Parcelas grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Mis Parcelas</h2>
        {data.parcelas.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-3">No tienes parcelas registradas</p>
            <a href="/parcelas/new" className="text-green-600 font-medium hover:underline">
              + Crear primera parcela
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.parcelas.map((parcela) => (
              <a
                key={parcela.id}
                href={`/parcelas/${parcela.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-800">{parcela.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  📍 {Number(parcela.latitude).toFixed(4)}, {Number(parcela.longitude).toFixed(4)}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: number; color?: string }) {
  const colorClasses = color === "red"
    ? "bg-red-50 border-red-200"
    : color === "amber"
    ? "bg-amber-50 border-amber-200"
    : "bg-white border-gray-200";

  return (
    <div className={`rounded-lg border p-4 ${colorClasses}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function formatAlertType(type: string) {
  const map: Record<string, string> = {
    temp_min: "Temp. baja",
    temp_max: "Temp. alta",
    soil_humidity_min: "Humedad suelo baja",
    precipitation_high: "Precip. alta",
  };
  return map[type] ?? type;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
