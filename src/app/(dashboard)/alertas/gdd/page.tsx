"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sigma, Snowflake, MapPin, Sprout } from "lucide-react";
import { analyzeClimate, GDD_BASE, CHILL_THRESHOLD, type DailyPoint, type ClimateAnalysis } from "@/lib/utils/climate-analytics";

interface Parcela { id: string; name: string }
interface ParcelaAnalysis { parcela: Parcela; analysis: ClimateAnalysis | null }

export default function GddPage() {
  const [items, setItems] = useState<ParcelaAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/parcelas")
      .then((r) => r.json())
      .then(async (parc) => {
        const list: Parcela[] = Array.isArray(parc) ? parc : [];
        const results = await Promise.all(
          list.map(async (p) => {
            try {
              const res = await fetch(`/api/parcelas/${p.id}/climate/history`).then((r) => r.json());
              const data: DailyPoint[] = res?.data ?? [];
              return { parcela: p, analysis: data.length ? analyzeClimate(data) : null };
            } catch {
              return { parcela: p, analysis: null };
            }
          })
        );
        setItems(results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <Link href="/alertas" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={15} /> Alertas
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Sigma size={22} className="text-amber-600" /> Grados-día y horas-frío
      </h1>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-900 space-y-2">
        <div>
          <p className="font-medium">¿Qué son los grados-día (GDD)?</p>
          <p>
            Es la acumulación de calor que reciben tus cultivos. Cada cultivo necesita cierta cantidad de
            grados-día para avanzar de una etapa a otra (germinar, florecer, madurar). Sumamos el calor diario
            por sobre una temperatura base de {GDD_BASE}°C. Mientras más GDD acumulados, más rápido se desarrolla
            el cultivo: sirve para <strong>estimar cuándo cosechar</strong>.
          </p>
        </div>
        <div>
          <p className="font-medium">¿Y las horas-frío?</p>
          <p>
            Muchos frutales (cerezos, manzanos, perales) necesitan acumular frío en invierno para florecer bien.
            Aquí mostramos una estimación de días fríos (mínima bajo {CHILL_THRESHOLD}°C) como referencia.
          </p>
        </div>
        <p className="text-xs text-amber-700">
          Cálculo sobre una ventana de 14 días (7 pasados + 7 de pronóstico), con datos reales de Open-Meteo.
        </p>
      </div>

      {loading ? (
        <div className="h-40 skeleton rounded-xl" />
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No tienes parcelas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(({ parcela, analysis }) => (
            <div key={parcela.id} className="bg-white rounded-xl border border-gray-200 p-4 animate-fade-in-up">
              <div className="font-medium text-gray-800 flex items-center gap-1.5 mb-3">
                <MapPin size={15} className="text-gray-400" /> {parcela.name}
              </div>
              {analysis ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-amber-50 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1 text-amber-600 mb-1"><Sprout size={14} /></div>
                    <div className="text-lg font-bold text-gray-800">{analysis.gddWindow}</div>
                    <div className="text-[10px] text-gray-500">GDD (14 días)</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1 text-orange-500 mb-1"><Sigma size={14} /></div>
                    <div className="text-lg font-bold text-gray-800">{analysis.gddForecast}</div>
                    <div className="text-[10px] text-gray-500">GDD pronóstico</div>
                  </div>
                  <div className="bg-sky-50 rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1 text-sky-600 mb-1"><Snowflake size={14} /></div>
                    <div className="text-lg font-bold text-gray-800">{analysis.chillDays}</div>
                    <div className="text-[10px] text-gray-500">Días fríos</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin datos climáticos para esta parcela.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
