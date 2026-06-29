"use client";

import { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Percent, Landmark, Sprout, BarChart3, Info } from "lucide-react";

interface MarketIndicator {
  key: string;
  label: string;
  help: string;
  value: number;
  unit: string;
  fecha: string;
}

interface Props {
  income: number;
  expense: number;
  totalHectares: number;
}

const clp = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

function iconFor(key: string) {
  if (key === "dolar" || key === "euro") return DollarSign;
  if (key === "ipc" || key === "tpm") return Percent;
  return Landmark;
}

function formatMarket(ind: MarketIndicator) {
  if (ind.unit?.toLowerCase() === "porcentaje") return `${ind.value}%`;
  return clp(ind.value);
}

export default function AgroIndicators({ income, expense, totalHectares }: Props) {
  const [market, setMarket] = useState<MarketIndicator[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [help, setHelp] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/business/indicators")
      .then((r) => r.json())
      .then((d) => setMarket(d?.available ? d.indicators : []))
      .catch(() => setMarket([]))
      .finally(() => setLoading(false));
  }, []);

  // Indicadores propios (calculados con los datos del agricultor)
  const balance = income - expense;
  const roi = expense > 0 ? Math.round((balance / expense) * 100) : null;
  const costPerHa = totalHectares > 0 ? expense / totalHectares : null;
  const incomePerHa = totalHectares > 0 ? income / totalHectares : null;

  const own = [
    {
      label: "Rentabilidad (ROI)",
      value: roi !== null ? `${roi}%` : "—",
      help: "Por cada $100 de gasto, cuánto ganas. Positivo = ganancia, negativo = pérdida.",
      icon: TrendingUp,
      good: roi !== null && roi >= 0,
    },
    {
      label: "Costo por hectárea",
      value: costPerHa !== null ? clp(costPerHa) : "—",
      help: "Cuánto gastas en promedio por cada hectárea de tu campo.",
      icon: Sprout,
      good: true,
    },
    {
      label: "Ingreso por hectárea",
      value: incomePerHa !== null ? clp(incomePerHa) : "—",
      help: "Cuánto produces en ingresos por cada hectárea.",
      icon: BarChart3,
      good: true,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-1">
        <BarChart3 size={18} className="text-green-600" /> Indicadores agrofinancieros
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Tu rentabilidad y los valores de mercado que afectan los costos e ingresos de tu campo.
      </p>

      {/* Indicadores propios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {own.map((o) => {
          const Icon = o.icon;
          return (
            <div key={o.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <Icon size={14} className="text-green-600" /> {o.label}
                </div>
                <button onClick={() => setHelp(help === o.label ? null : o.label)} className="text-gray-300 hover:text-gray-500">
                  <Info size={13} />
                </button>
              </div>
              <div className={`text-lg font-bold mt-1 ${o.label.includes("ROI") ? (o.good ? "text-emerald-700" : "text-red-600") : "text-gray-800"}`}>
                {o.value}
              </div>
              {help === o.label && <p className="text-[11px] text-gray-500 mt-1 leading-snug">{o.help}</p>}
            </div>
          );
        })}
      </div>

      {/* Indicadores de mercado */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mercado hoy</p>
      {loading ? (
        <div className="h-20 skeleton rounded-xl" />
      ) : !market || market.length === 0 ? (
        <p className="text-sm text-gray-400">No se pudieron cargar los indicadores de mercado por ahora.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {market.map((ind) => {
            const Icon = iconFor(ind.key);
            return (
              <div key={ind.key} className="rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors" title={ind.help}>
                <div className="flex items-center gap-1 text-gray-400 text-[11px] font-medium mb-0.5">
                  <Icon size={12} /> {ind.label}
                </div>
                <div className="text-sm font-bold text-gray-800 leading-tight">{formatMarket(ind)}</div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-[10px] text-gray-400 mt-3">Fuente: mindicador.cl · Valores referenciales del día.</p>
    </div>
  );
}
