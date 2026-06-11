"use client";

import { useEffect, useState } from "react";
import {
  Map, Sprout, Bell, CalendarCheck, Plus, AlertTriangle,
  Droplets, Scissors, FlaskConical
} from "lucide-react";
import { NotificationBanner, InstallAppBanner } from "@/components/ui/AppBanners";

interface DashboardData {
  summary: { activeParcelas: number; activeCultivos: number; pendingAlerts: number; upcomingReminders: number };
  parcelas: Array<{ id: string; name: string; latitude: string; longitude: string; color: string | null }>;
  recentAlerts: Array<{ id: string; alert_type: string; detected_value: string; created_at: string }>;
  upcomingReminders: Array<{ id: string; task_type: string; scheduled_at: string; status: string }>;
}

// ---- Main Dashboard ----
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
      <div className="space-y-4">
        <div className="h-8 skeleton w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 skeleton" />)}
        </div>
        <div className="h-32 skeleton" />
        <div className="h-48 skeleton" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Error cargando dashboard</p>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-800 animate-fade-in-up-1">Dashboard</h1>

      {/* Banners */}
      <div className="space-y-3 animate-fade-in-up-2">
        <NotificationBanner />
        <InstallAppBanner />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up-2">
        <SummaryCard icon={Map} label="Parcelas" value={data.summary.activeParcelas} href="/parcelas" />
        <SummaryCard icon={Sprout} label="Cultivos" value={data.summary.activeCultivos} href="/cultivos" />
        <SummaryCard icon={Bell} label="Alertas" value={data.summary.pendingAlerts} color="red" href="/alertas" />
        <SummaryCard icon={CalendarCheck} label="Recordatorios" value={data.summary.upcomingReminders} color="amber" href="/recordatorios" />
      </div>

      {/* Alerts banner */}
      {data.recentAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 font-semibold text-red-800 mb-2">
            <AlertTriangle size={16} />
            Alertas Pendientes
          </div>
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
      {data.upcomingReminders.filter(r => new Date(r.scheduled_at).getTime() >= Date.now()).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
            <CalendarCheck size={16} />
            Próximos Recordatorios
          </div>
          <ul className="space-y-2">
            {data.upcomingReminders
              .filter(r => new Date(r.scheduled_at).getTime() >= Date.now())
              .map((reminder) => (
              <li key={reminder.id} className="text-sm text-amber-700 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  {taskIcon(reminder.task_type)}
                  <span className="capitalize">{reminder.task_type}</span>
                </span>
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
            <Map size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 mb-3">No tienes parcelas registradas</p>
            <a href="/parcelas/new" className="text-green-600 font-medium hover:underline flex items-center justify-center gap-1">
              <Plus size={16} /> Crear primera parcela
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.parcelas.map((p) => (
              <a key={p.id} href={`/parcelas/${p.id}`}
                className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5" style={{ backgroundColor: p.color ?? "#16a34a" }} />
                <div className="p-4">
                  <h3 className="font-medium text-gray-800">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Helper components & functions ----

import type { LucideIcon } from "lucide-react";

function SummaryCard({ icon: Icon, label, value, color, href }: { icon: LucideIcon; label: string; value: number; color?: string; href?: string }) {
  const colorClasses = color === "red" ? "bg-red-50 border-red-200"
    : color === "amber" ? "bg-amber-50 border-amber-200"
    : "bg-white border-gray-200";
  const iconColor = color === "red" ? "text-red-500" : color === "amber" ? "text-amber-500" : "text-green-600";

  const content = (
    <div className={`rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${colorClasses} h-full`}>
      <Icon size={22} className={`${iconColor} mb-2`} />
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );

  if (href) {
    return <a href={href} className="block h-full">{content}</a>;
  }
  return content;
}

function taskIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    riego: <Droplets size={14} className="text-blue-500" />,
    poda: <Scissors size={14} className="text-gray-500" />,
    fertilizacion: <FlaskConical size={14} className="text-purple-500" />,
  };
  return icons[type] ?? <CalendarCheck size={14} />;
}

function formatAlertType(type: string) {
  const map: Record<string, string> = {
    temp_min: "Temperatura baja", temp_max: "Temperatura alta",
    soil_humidity_min: "Humedad suelo baja", precipitation_high: "Precipitación alta",
  };
  return map[type] ?? type;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
