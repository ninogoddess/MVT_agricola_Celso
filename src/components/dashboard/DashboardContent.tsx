"use client";

import { useEffect, useState } from "react";
import {
  Map, Sprout, Bell, CalendarCheck, Plus, AlertTriangle,
  Droplets, Scissors, FlaskConical, BellRing, X, ChevronRight,
  Smartphone
} from "lucide-react";

interface DashboardData {
  summary: { activeParcelas: number; activeCultivos: number; pendingAlerts: number; upcomingReminders: number };
  parcelas: Array<{ id: string; name: string; latitude: string; longitude: string; color: string | null }>;
  recentAlerts: Array<{ id: string; alert_type: string; detected_value: string; created_at: string }>;
  upcomingReminders: Array<{ id: string; task_type: string; scheduled_at: string; status: string }>;
}

// ---- Notification Tutorial Modal ----
const ANDROID_STEPS = [
  { step: 1, text: "Abre Chrome en tu Android y entra a la app." },
  { step: 2, text: "Toca los 3 puntos (⋮) arriba a la derecha." },
  { step: 3, text: 'Selecciona "Configuración del sitio".' },
  { step: 4, text: 'Toca "Notificaciones" y activa el permiso.' },
  { step: 5, text: 'Vuelve al dashboard y toca "Activar notificaciones" cuando aparezca la solicitud del navegador.' },
  { step: 6, text: "Listo. Recibirás recordatorios aunque tengas el navegador en segundo plano." },
];

function NotificationTutorial({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
      onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Smartphone size={18} className="text-green-600" />
            Activar notificaciones en Android
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {ANDROID_STEPS.map(({ step, text }) => (
            <div key={step} className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {step}
              </div>
              <p className="text-sm text-gray-700 pt-0.5">{text}</p>
            </div>
          ))}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mt-2">
            <strong>iOS (iPhone):</strong> Las notificaciones push funcionan en Safari desde iOS 16.4.
            Ve a Configuración → Safari → Notificaciones y actívalas para este sitio.
          </div>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 min-h-[44px]">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Notification Banner ----
function NotificationBanner() {
  const [status, setStatus] = useState<"unknown" | "granted" | "denied" | "default">("unknown");
  const [showTutorial, setShowTutorial] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setStatus(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setStatus(result);
  }

  if (dismissed || status === "granted" || status === "unknown") return null;

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellRing size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-blue-800 text-sm">Activa las notificaciones para recibir tus recordatorios</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Recibirás avisos de riego, poda y fertilización directamente en tu celular.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {status === "default" && (
                <button onClick={requestPermission}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 min-h-[36px]">
                  Activar notificaciones
                </button>
              )}
              <button onClick={() => setShowTutorial(true)}
                className="px-3 py-1.5 border border-blue-300 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 min-h-[36px] flex items-center gap-1">
                <Smartphone size={13} />
                Ver tutorial Android
                <ChevronRight size={13} />
              </button>
              {status === "denied" && (
                <span className="text-xs text-red-500 self-center">
                  Permiso denegado. Actívalas manualmente desde la configuración del navegador.
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setDismissed(true)}
            className="text-blue-400 hover:text-blue-600 min-w-[32px] min-h-[32px] flex items-center justify-center flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      </div>

      {showTutorial && <NotificationTutorial onClose={() => setShowTutorial(false)} />}
    </>
  );
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
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Error cargando dashboard</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Notification banner */}
      <NotificationBanner />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={Map} label="Parcelas" value={data.summary.activeParcelas} />
        <SummaryCard icon={Sprout} label="Cultivos" value={data.summary.activeCultivos} />
        <SummaryCard icon={Bell} label="Alertas" value={data.summary.pendingAlerts} color="red" />
        <SummaryCard icon={CalendarCheck} label="Recordatorios" value={data.summary.upcomingReminders} color="amber" />
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
      {data.upcomingReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-800 mb-2">
            <CalendarCheck size={16} />
            Próximos Recordatorios
          </div>
          <ul className="space-y-2">
            {data.upcomingReminders.map((reminder) => (
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

function SummaryCard({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: number; color?: string }) {
  const colorClasses = color === "red" ? "bg-red-50 border-red-200"
    : color === "amber" ? "bg-amber-50 border-amber-200"
    : "bg-white border-gray-200";
  const iconColor = color === "red" ? "text-red-500" : color === "amber" ? "text-amber-500" : "text-green-600";

  return (
    <div className={`rounded-lg border p-4 ${colorClasses}`}>
      <Icon size={22} className={`${iconColor} mb-1`} />
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
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
