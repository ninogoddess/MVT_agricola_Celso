"use client";

import { useEffect, useState } from "react";
import {
  Droplets, Thermometer, Sun, CloudRain, Wind, Sprout,
  Wheat, FlaskConical, AlertTriangle, Info, CheckCircle,
  RefreshCw, BarChart3, MapPin, TrendingUp
} from "lucide-react";

interface Recommendation {
  id: string;
  parcelaId: string;
  parcelaName: string;
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  climate: { temp: number; humidity: number; precipProb: number; wind: number };
  icon: string;
  suggestedCrops?: string[];
  daysToHarvest?: number;
}

interface Summary {
  totalParcelas: number;
  parcelasWithClimate: number;
  avgTemperature: number;
  highPriority: number;
}

// ─── Icon resolver ─────────────────────────────────────────────
function RecoIcon({ name, size = 20, className = "" }: { name: string; size?: number; className?: string }) {
  const map: Record<string, React.ElementType> = {
    droplets: Droplets,
    thermometer: Thermometer,
    sun: Sun,
    "cloud-rain": CloudRain,
    wind: Wind,
    sprout: Sprout,
    wheat: Wheat,
    flask: FlaskConical,
  };
  const Icon = map[name] ?? Info;
  return <Icon size={size} className={className} />;
}

// ─── Priority config ────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high: {
    border: "border-red-200",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    icon: <AlertTriangle size={14} />,
    label: "Urgente",
    dot: "bg-red-500",
  },
  medium: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    icon: <TrendingUp size={14} />,
    label: "Recomendado",
    dot: "bg-amber-400",
  },
  low: {
    border: "border-blue-100",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-600",
    icon: <Info size={14} />,
    label: "Informativo",
    dot: "bg-blue-400",
  },
};

const TYPE_COLOR: Record<string, string> = {
  riego: "text-cyan-600",
  alerta: "text-red-500",
  siembra: "text-green-600",
  cosecha: "text-amber-600",
  fertilizacion: "text-purple-600",
  info: "text-blue-500",
};

// ─── Card ───────────────────────────────────────────────────────
function RecoCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = PRIORITY_CONFIG[rec.priority];
  const iconColor = TYPE_COLOR[rec.type] ?? "text-gray-500";

  return (
    <div
      className={`bg-white rounded-2xl border ${cfg.border} p-5 card-hover animate-fade-in-up`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
          <RecoIcon name={rec.icon} size={22} className={iconColor} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-gray-800 leading-tight">{rec.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.badge} flex-shrink-0`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">{rec.description}</p>

          {/* Suggested crops */}
          {rec.suggestedCrops && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {rec.suggestedCrops.map((c) => (
                <span key={c} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full capitalize font-medium border border-green-100">
                  {c}
                </span>
              ))}
            </div>
          )}

          {/* Days to harvest badge */}
          {rec.daysToHarvest !== undefined && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 mb-3">
              <Wheat size={12} />
              {rec.daysToHarvest === 0 ? "¡Cosecha hoy!" : `${rec.daysToHarvest} días para cosechar`}
            </div>
          )}

          {/* Footer: parcela + clima */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 mt-2 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-sm font-bold text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
              <MapPin size={16} className="text-green-600" /> Parcela: {rec.parcelaName}
            </span>
            <div className="flex gap-4 text-sm font-medium text-gray-700 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
              <span className="flex items-center gap-1.5" title="Temperatura"><Thermometer size={16} className="text-red-500" />{rec.climate.temp}°C</span>
              <span className="flex items-center gap-1.5" title="Humedad"><Droplets size={16} className="text-blue-500" />{rec.climate.humidity}%</span>
              <span className="flex items-center gap-1.5" title="Probabilidad de lluvia"><CloudRain size={16} className="text-cyan-500" />{rec.climate.precipProb}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────
export default function RecomendacionesGlobalesPage() {
  const [data, setData] = useState<{ recommendations: Recommendation[]; summary: Summary | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "riego" | "siembra" | "cosecha" | "fertilizacion">("all");
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    const res = await fetch("/api/recommendations");
    const json = await res.json();
    setData(json);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const TYPE_FILTERS = [
    { key: "all", label: "Todas" },
    { key: "high", label: "Urgentes" },
    { key: "riego", label: "Riego" },
    { key: "siembra", label: "Siembra" },
    { key: "cosecha", label: "Cosecha" },
    { key: "fertilizacion", label: "Fertilización" },
  ] as const;

  const filtered = data?.recommendations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "high") return r.priority === "high";
    return r.type === filter;
  }) ?? [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 skeleton w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recomendaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Basadas en el clima actual y el estado de tus cultivos</p>
        </div>
        <button onClick={load} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all min-h-[40px]">
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Summary cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up-2">
          <SummaryTile icon={BarChart3} label="Recomendaciones" value={data.recommendations.length} color="green" />
          <SummaryTile icon={AlertTriangle} label="Urgentes" value={data.summary.highPriority} color="red" />
          <SummaryTile icon={Thermometer} label="Temp. promedio" value={`${data.summary.avgTemperature}°C`} color="blue" />
          <SummaryTile icon={MapPin} label="Parcelas" value={`${data.summary.parcelasWithClimate}/${data.summary.totalParcelas}`} color="gray" />
        </div>
      )}

      {/* No climate data warning */}
      {data?.summary && data.summary.parcelasWithClimate === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Sin datos climáticos disponibles</p>
            <p className="text-amber-600 text-xs mt-0.5">Los cron jobs aún no han corrido o no hay parcelas activas. Las recomendaciones se generarán cuando el sistema tenga datos climáticos.</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTERS.map(({ key, label }) => {
          const count = key === "all" ? data?.recommendations.length
            : key === "high" ? data?.summary?.highPriority
            : data?.recommendations.filter((r) => r.type === key).length;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] ${
                filter === key
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700"
              }`}>
              {label} {count !== undefined && count > 0 && <span className="ml-1 opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 animate-fade-in-up">
          <CheckCircle size={44} className="mx-auto text-green-400 mb-3" />
          <p className="font-semibold text-gray-700">Todo en orden</p>
          <p className="text-gray-400 text-sm mt-1">No hay recomendaciones de este tipo por ahora</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((rec, i) => <RecoCard key={rec.id} rec={rec} index={i} />)}
        </div>
      )}
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-500",
    blue: "bg-blue-50 text-blue-600",
    gray: "bg-gray-50 text-gray-500",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3.5 card-hover">
      <div className={`w-8 h-8 rounded-lg ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon size={16} />
      </div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
