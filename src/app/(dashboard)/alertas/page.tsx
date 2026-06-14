"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Thermometer, Droplets, CloudRain, CheckCircle, Bell, BadgeAlert, Snowflake, Flame, Sigma, ArrowRight } from "lucide-react";

interface Alert {
  id: string;
  alert_type: string;
  detected_value: string;
  threshold_value: string;
  status: string;
  grouped_count: number;
  created_at: string;
}

const ALERT_CONFIG: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
  temp_min: { label: "Temperatura baja", Icon: Thermometer, color: "text-blue-500" },
  temp_max: { label: "Temperatura alta", Icon: Thermometer, color: "text-red-500" },
  soil_humidity_min: { label: "Humedad de suelo baja", Icon: Droplets, color: "text-orange-500" },
  precipitation_high: { label: "Precipitación alta", Icon: CloudRain, color: "text-indigo-500" },
};

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

  if (loading) return <div className="h-48 skeleton rounded-xl" />;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-800">Alertas</h1>

      {/* Herramientas de prevención climática */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/alertas/heladas"
          className="group bg-white rounded-2xl border-2 border-sky-200 p-5 flex flex-col card-hover transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Snowflake size={20} className="text-sky-600" />
            </div>
            <Flame size={18} className="text-orange-500" />
          </div>
          <h2 className="font-bold text-gray-900">Heladas y golpe de calor</h2>
          <p className="text-sm text-gray-600 mt-1 flex-1">
            Revisa el pronóstico de 7 días de cada parcela y anticipa días con frío o calor extremo
            que pueden dañar tus cultivos.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 mt-3">
            Ver pronóstico <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>

        <Link href="/alertas/gdd"
          className="group bg-white rounded-2xl border-2 border-amber-200 p-5 flex flex-col card-hover transition-all">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
            <Sigma size={20} className="text-amber-600" />
          </div>
          <h2 className="font-bold text-gray-900">Grados-día y horas-frío</h2>
          <p className="text-sm text-gray-600 mt-1 flex-1">
            Acumulación térmica que ayuda a estimar el desarrollo de tus cultivos y a predecir
            floración o cosecha en frutales.
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 mt-3">
            Ver acumulación <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>

      <h2 className="font-semibold text-gray-800 pt-2">Alertas activas</h2>

      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CheckCircle size={44} className="mx-auto text-green-400 mb-3" />
          <p className="text-gray-500 font-medium">Todo en orden</p>
          <p className="text-gray-400 text-sm mt-1">No hay alertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const cfg = ALERT_CONFIG[alert.alert_type];
            const Icon = cfg?.Icon ?? BadgeAlert;
            const color = cfg?.color ?? "text-gray-500";
            return (
              <div
              key={alert.id}
              className="bg-white rounded-xl border border-red-100 p-4 flex items-center justify-between gap-3 animate-fade-in-up card-hover">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0">
                    <Icon size={20} className={color} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                      <span>{cfg?.label ?? alert.alert_type}</span>
                      {alert.grouped_count > 1 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                          ×{alert.grouped_count} ocurrencias
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5">
                      Valor detectado: <strong>{alert.detected_value}</strong> · Umbral: {alert.threshold_value}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(alert.created_at).toLocaleString("es-CL")}
                    </div>
                  </div>
                </div>
                <button onClick={() => markAsRead(alert.id)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-green-50 hover:text-green-700 min-h-[44px] flex items-center gap-1.5 flex-shrink-0">
                  <CheckCircle size={15} />
                  Leída
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
